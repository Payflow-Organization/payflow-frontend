"use client";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRegister } from "@/lib/hooks/use-auth";

const formSchema = z
  .object({
    fullName: z.string().min(3, "Full name must be at least 3 characters"),
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function Page() {
  const { mutate: register, isPending, error } = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    const { confirmPassword, ...payload } = data;
    register(payload);
  }

  return (
    <div className="w-full p-5! space-y-2">
      <CardHeader className="text-center">
        <CardTitle className="font-semibold text-3xl">Create Account</CardTitle>
        <CardDescription className="font-normal text-base">
          Set up your account in seconds.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full flex flex-col gap-6"
        >
          <Controller
            name="fullName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="text"
                  placeholder="John Doe"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Email Address</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="email"
                  placeholder="name@example.com"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <div className="relative">
                  <Input
                    {...field}
                    id={field.name}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    aria-invalid={fieldState.invalid}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span className="text-xs text-muted">
                  Must be at least 8 characters.
                </span>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="confirmPassword"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Confirm Password</FieldLabel>
                <div className="relative">
                  <Input
                    {...field}
                    id={field.name}
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat your password"
                    aria-invalid={fieldState.invalid}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((p) => !p)}
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          {error && (
            <p className="text-sm text-destructive">
              {(error as { message?: string })?.message ??
                "Registration failed"}
            </p>
          )}
          <Button
            type="submit"
            className="w-full font-normal text-base"
            disabled={isPending}
            size="lg"
          >
            {isPending ? "Creating account..." : "Create Account"}
            <ArrowRight />
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center justify-center -mt-2">
        <hr className="h-2 w-full" />
        <div className="flex gap-1 items-center text-muted font-medium text-sm">
          Already have an account?{" "}
          <Button
            variant="link"
            className="px-0"
            onClick={() => router.push("/login")}
          >
            Sign In
          </Button>
        </div>
      </CardFooter>
    </div>
  );
}
