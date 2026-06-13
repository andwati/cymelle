import { Button } from "#/components/ui/button.tsx"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card.tsx"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "#/components/ui/field.tsx"
import { Input } from "#/components/ui/input.tsx"

type SignupFormProps = React.ComponentProps<typeof Card> & {
  displayName: string
  username: string
  password: string
  confirmPassword: string
  error?: string | null
  pending?: boolean
  onDisplayNameChange: (value: string) => void
  onUsernameChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onLoginClick: () => void
}

export function SignupForm({
  displayName,
  username,
  password,
  confirmPassword,
  error,
  pending = false,
  onDisplayNameChange,
  onUsernameChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  onLoginClick,
  ...props
}: SignupFormProps) {
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Create a customer account to place orders and request rides.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="signup-display-name">Display name</FieldLabel>
              <Input
                id="signup-display-name"
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={(event) => onDisplayNameChange(event.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="signup-username">Username</FieldLabel>
              <Input
                id="signup-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) => onUsernameChange(event.target.value)}
                required
              />
              <FieldDescription>
                This is what you will use when signing in.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="signup-password">Password</FieldLabel>
              <Input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                required
              />
              <FieldDescription>
                Must be at least 8 characters long.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="signup-confirm-password">
                Confirm Password
              </FieldLabel>
              <Input
                id="signup-confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => onConfirmPasswordChange(event.target.value)}
                required
              />
              <FieldDescription>Please confirm your password.</FieldDescription>
            </Field>
            {error ? <FieldError>{error}</FieldError> : null}
            <FieldGroup>
              <Field>
                <Button type="submit" disabled={pending}>
                  {pending ? "Creating account..." : "Create account"}
                </Button>
                <FieldDescription className="px-6 text-center">
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="underline underline-offset-4 hover:text-primary"
                    onClick={onLoginClick}
                  >
                    Sign in
                  </button>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
