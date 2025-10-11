import { GitHub } from 'arctic';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '$env/static/private';
import { dev } from '$app/environment';

export const github = new GitHub(
	GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET,
	dev
		? 'http://localhost:5173/sign-in/github/callback'
		: 'https://yourdomain.com/sign-in/github/callback'
);
