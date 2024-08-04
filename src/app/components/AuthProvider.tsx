'use client';

import {
	type User,
	onAuthStateChanged,
	signInWithEmailAndPassword,
} from "firebase/auth";
import { type ReactNode, useEffect, useState } from "react";
import { auth } from "../firebase";
import { Button } from './button';
import {Heading} from './heading';

const AuthProvider = ({ children }: { children?: ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

    // Get the firebase access token and call https://goodtoucan.com/ALJPAW5/api/algolia/key/generate?token=${firebase_access_token}
    // Then save this in localstorage as the aloglia api key

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log({user: user?.accessToken})
            const getAlgoliaApiKey = async () => {
							if(!user) return
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ accessToken: user.accessToken }),
                });
                const data = await res.json();
                console.log({data})
                localStorage.setItem('ALGOLIA_API_KEY', data.apiKey);
            }
                getAlgoliaApiKey()

			setUser(user);
			setLoading(false);
		});

		return () => unsubscribe();
	}, []);

	const handleLogin = async (email: string, password: string) => {
		setLoading(true);
		try {
			await signInWithEmailAndPassword(auth, email, password);
			setError(null);
		} catch (err) {
			console.error(err);
			setError(err.message);
			setLoading(false);
		}
	};

	return (
		<div>
			{loading ? (
				<p>Loading...</p>
			) : user ? (
				children
			) : (
				<div>
					<Heading>Login</Heading>
					{error && <p style={{ color: "red" }}>{error}</p>}
					<Button
						onClick={() => handleLogin("matt@ketodev.com", "rofl09")}
					>
						Login
					</Button>
				</div>
			)}
		</div>
	);
};

export default AuthProvider;
