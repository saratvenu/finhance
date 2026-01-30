# start_predictor.ps1

# allow scripts for this session only
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

# project directory
Set-Location "I:\finhance\finhance\budget-ml"

# activate venv
.\.venv\Scripts\Activate.ps1

# use calibrated model
$env:MODEL_PATH = "budget_model.pkl"

# start API server
uvicorn src.predict_service:app --host 0.0.0.0 --port 8000 --reload
