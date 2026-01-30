"use client";

import { useState, ReactNode } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "@heroui/drawer";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import { toast } from "sonner";

import { createAccount } from "@/actions/accounts";
import { accountSchema, AccountFormData } from "@/app/lib/schema";

interface CreateAccountDrawerProps {
  children?: ReactNode;
}

export default function CreateAccountDrawer({ children }: CreateAccountDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "CURRENT",
      balance: "",
      isDefault: false,
    },
  });

  const onSubmit: SubmitHandler<AccountFormData> = async (values) => {
    const result = await createAccount(values);

    if (result.success) {
      toast.success("Account created successfully!");
      setIsOpen(false);
      reset();
    } else {
      toast.error(result.message || "Failed to create account");
    }
  };

  return (
    <>
      {/* Custom trigger or default button */}
      {children ? (
        <div onClick={() => setIsOpen(true)}>{children}</div>
      ) : (
        <Button color="primary" onPress={() => setIsOpen(true)}>
          Create Account
        </Button>
      )}

      <Drawer isOpen={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent>
          <DrawerHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Create New Account
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add a new account to track your transactions.
            </p>
          </DrawerHeader>

          <DrawerBody>
            <form
              id="account-form"
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <Input
                label="Account Name"
                placeholder="e.g. Savings"
                {...register("name")}
                isInvalid={!!errors.name}
                errorMessage={errors.name?.message}
              />

              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Account Type"
                    selectedKeys={field.value ? [field.value] : []}
                    onSelectionChange={(keys) => {
                      const value = Array.from(keys)[0] as string;
                      field.onChange(value);
                    }}
                    isInvalid={!!errors.type}
                    errorMessage={errors.type?.message}
                  >
                    <SelectItem key="CURRENT">Current</SelectItem>
                    <SelectItem key="SAVINGS">Savings</SelectItem>
                  </Select>
                )}
              />

              <Input
                label="Balance"
                type="text"
                placeholder="Enter initial balance"
                {...register("balance")}
                isInvalid={!!errors.balance}
                errorMessage={errors.balance?.message}
              />

              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-900 dark:text-white">
                  Set as default account
                </span>
                <Controller
                  name="isDefault"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      isSelected={field.value}
                      onValueChange={field.onChange}
                    />
                  )}
                />
              </div>
            </form>
          </DrawerBody>

          <DrawerFooter>
            <Button
              color="primary"
              type="submit"
              form="account-form"
              isLoading={isSubmitting}
            >
              Create
            </Button>
            <Button variant="light" onPress={() => setIsOpen(false)}>
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}