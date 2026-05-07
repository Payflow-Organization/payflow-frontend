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
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLogin } from "@/lib/hooks/use-auth";

const formSchema = z.object({
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/\d/, "Password must include at least one number"),
});

export default function Page() {
  const { mutate: login, isPending, error } = useLogin();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    login(data);
  }

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const router = useRouter();

  return (
    <div className="w-full !p-5 space-y-12">
      <CardHeader className="text-center">
        <CardTitle className="font-semibold text-3xl">Welcome Back</CardTitle>
        <CardDescription className="font-normal text-base">
          Sign in to your account to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full flex flex-col gap-6"
        >
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
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span className="text-xs text-muted">
                  Must be at least 8 characters with one number.
                </span>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          {error && (
            <p className="text-sm text-destructive">
              {(error as { message?: string })?.message ??
                "Invalid credentials"}
            </p>
          )}
          <Button
            type="submit"
            className="w-full font-normal text-base capitalize"
            disabled={isPending}
            size="lg"
          >
            {isPending ? "Signing in..." : "Sign In to dashboard"}
            <ArrowRight />
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center justify-center -mt-2">
        <hr className="h-2 w-full" />
        <div className="flex gap-1 items-center text-muted font-medium text-sm">
          New to the platform?{" "}
          <Button
            variant="link"
            className="px-0"
            onClick={() => router.push("/register")}
          >
            Create Account
          </Button>
        </div>
      </CardFooter>
    </div>
  );
}
