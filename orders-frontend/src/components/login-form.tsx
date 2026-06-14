import { Button } from "#/components/ui/button.tsx";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card.tsx";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field.tsx";
import { Input } from "#/components/ui/input.tsx";
import { cn } from "#/lib/utils.ts";

type LoginFormProps = Omit<React.ComponentProps<"div">, "onSubmit"> & {
	username: string;
	password: string;
	error?: string | null;
	pending?: boolean;
	onUsernameChange: (value: string) => void;
	onPasswordChange: (value: string) => void;
	onSubmit: (event: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
	onSignupClick: () => void;
};

export function LoginForm({
	className,
	username,
	password,
	error,
	pending = false,
	onUsernameChange,
	onPasswordChange,
	onSubmit,
	onSignupClick,
	...props
}: LoginFormProps) {
	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card>
				<CardHeader>
					<CardTitle>Sign in to Cymelle</CardTitle>
					<CardDescription>
						Use your username and password to continue.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={onSubmit}>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="login-username">Username</FieldLabel>
								<Input
									id="login-username"
									type="text"
									autoComplete="username"
									value={username}
									onChange={(event) => onUsernameChange(event.target.value)}
									required
								/>
							</Field>
							<Field>
								<div className="flex items-center">
									<FieldLabel htmlFor="login-password">Password</FieldLabel>
								</div>
								<Input
									id="login-password"
									type="password"
									autoComplete="current-password"
									value={password}
									onChange={(event) => onPasswordChange(event.target.value)}
									required
								/>
							</Field>
							{error ? <FieldError>{error}</FieldError> : null}
							<Field>
								<Button type="submit" disabled={pending}>
									{pending ? "Signing in..." : "Sign in"}
								</Button>
								<FieldDescription className="text-center">
									Don&apos;t have an account?{" "}
									<button
										type="button"
										className="underline underline-offset-4 hover:text-primary"
										onClick={onSignupClick}
									>
										Sign up
									</button>
								</FieldDescription>
							</Field>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
