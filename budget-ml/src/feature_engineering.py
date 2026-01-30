import pandas as pd
import numpy as np
from typing import Tuple

EPS = 1e-9

def prepare_time_series_features(df: pd.DataFrame, keep_last_row_for_inference: bool = False) -> pd.DataFrame:
    """
    Prepare monthly aggregated time-series features per (account_id, category).

    TRAINING MODE (default):
      - Drops the last row in each group (label_next_month is NaN)
    
    INFERENCE MODE (keep_last_row_for_inference=True):
      - Keeps the last month, even if label_next_month is NaN
      - This allows predicting the next unseen month.
    
    Assumptions:
      - df has columns: date, account_id, category, amount
      - amount can be positive/negative; we assume monthly sums are the signal
    """
    df = df.copy()
    df['date'] = pd.to_datetime(df['date'])
    df['month'] = df['date'].dt.to_period('M')

    monthly = (
        df.groupby(['account_id', 'category', 'month'], as_index=False)
          .amount.sum()
          .rename(columns={'amount': 'month_sum'})
    )

    monthly['month_start'] = monthly['month'].dt.to_timestamp()
    monthly = monthly.sort_values(['account_id', 'category', 'month_start'])

    out_rows = []
    for (acct, cat), g in monthly.groupby(['account_id', 'category']):
        g = g.sort_values('month_start').reset_index(drop=True)

        # Prev-month feature
        g['sum_prev_1m'] = g['month_sum'].shift(1)

        # Rolling means (exclude current month)
        g['avg_3m'] = g['month_sum'].rolling(window=3, min_periods=1).mean().shift(1).fillna(0)
        g['avg_6m'] = g['month_sum'].rolling(window=6, min_periods=1).mean().shift(1).fillna(0)

        g['avg_1m'] = g['sum_prev_1m'].fillna(0)

        # Rolling std/count
        g['std_6m'] = g['month_sum'].rolling(window=6, min_periods=1).std().shift(1).fillna(0)
        g['count_6m'] = g['month_sum'].rolling(window=6, min_periods=1).count().shift(1).fillna(0)

        # Trend features
        g['growth_1m_over_3m'] = (g['avg_1m'] - g['avg_3m']) / (g['avg_3m'] + EPS)
        g['ratio_1m_over_6m'] = (g['avg_1m'] + EPS) / (g['avg_6m'] + EPS)

        # Volatility normalized
        g['std_norm'] = g['std_6m'] / (g['avg_6m'].replace(0, np.nan).abs() + EPS)
        g['std_norm'] = g['std_norm'].fillna(0)

        # Seasonality
        g['seasonality_month'] = g['month_start'].dt.month - 1
        g['season_sin'] = np.sin(2 * np.pi * g['seasonality_month'] / 12)
        g['season_cos'] = np.cos(2 * np.pi * g['seasonality_month'] / 12)

        # Recurring flag
        g['is_recurring_candidate'] = (
            (g['std_6m'] < (0.2 * (g['avg_6m'] + EPS))) & (g['count_6m'] >= 3)
        ).astype(int)

        # Target label
        g['label_next_month'] = g['month_sum'].shift(-1)

        out_rows.append(g)

    features = pd.concat(out_rows, ignore_index=True)

    # Training mode (original)
    if not keep_last_row_for_inference:
        features = features.dropna(subset=['label_next_month']).reset_index(drop=True)
    else:
        # Inference mode: KEEP the last row even if label_next_month is NaN
        features = features.reset_index(drop=True)

    # Fill NaN numeric values
    num_cols = features.select_dtypes(include=[np.number]).columns.tolist()
    features[num_cols] = features[num_cols].fillna(0)

    return features
