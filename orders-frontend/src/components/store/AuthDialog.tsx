import { useEffect, useState } from "react";
import { LoginForm } from "#/components/login-form.tsx";
import { SignupForm } from "#/components/signup-form.tsx";
import { Dialog, DialogContent } from "#/components/ui/dialog.tsx";

type AuthDialogProps = {
	open: boolean;
	initialMode: "login" | "register";
	onOpenChange: (open: boolean) => void;
	onLogin: (request: {
		username: string;
		password: string;
	}) => Promise<unknown>;
	onRegister: (request: {
		username: string;
		password: string;
		displayName: string;
	}) => Promise<unknown>;
};

export function AuthDialog({
	open,
	initialMode,
	onOpenChange,
	onLogin,
	onRegister,
}: AuthDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md border-0 bg-transparent p-0 shadow-none">
				<AuthForm
					initialMode={initialMode}
					onLogin={onLogin}
					onRegister={onRegister}
				/>
			</DialogContent>
		</Dialog>
	);
}

export function AuthForm({
	initialMode,
	onLogin,
	onRegister,
}: Omit<AuthDialogProps, "open" | "onOpenChange">) {
	const [mode, setMode] = useState<"login" | "register">(initialMode);
	const [username, setUsername] = useState("");
	const [displayName, setDisplayName] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	useEffect(() => {
		setMode(initialMode);
		setError(null);
	}, [initialMode]);

	async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setPending(true);

		try {
			await onLogin({ username, password });
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : "Sign in failed");
		} finally {
			setPending(false);
		}
	}

	async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		setPending(true);

		try {
			await onRegister({ username, displayName, password });
			await onLogin({ username, password });
		} catch (caught) {
			setError(
				caught instanceof Error ? caught.message : "Account creation failed",
			);
		} finally {
			setPending(false);
		}
	}

	if (mode === "register") {
		return (
			<SignupForm
				displayName={displayName}
				username={username}
				password={password}
				confirmPassword={confirmPassword}
				error={error}
				pending={pending}
				onDisplayNameChange={setDisplayName}
				onUsernameChange={setUsername}
				onPasswordChange={setPassword}
				onConfirmPasswordChange={setConfirmPassword}
				onSubmit={handleSignup}
				onLoginClick={() => {
					setMode("login");
					setError(null);
				}}
			/>
		);
	}

	return (
		<LoginForm
			username={username}
			password={password}
			error={error}
			pending={pending}
			onUsernameChange={setUsername}
			onPasswordChange={setPassword}
			onSubmit={handleLogin}
			onSignupClick={() => {
				setMode("register");
				setError(null);
			}}
		/>
	);
}
