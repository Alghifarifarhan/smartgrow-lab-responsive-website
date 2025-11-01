# Security Policy

## Supported Versions

This project is a live web application and does not follow traditional software versioning schemes (e.g., 5.1.x). Our security policy applies to code that is currently active and deployed on the main production domain.
| Version                       | Supported          |
| -------                       | ------------------ |
| Versi main (Production)       | :white_check_mark: |
| Versi lama / non-production   | :x:                |

## Reporting a Vulnerability

We take security issues very seriously. If you discover a security vulnerability, please report it to us via email at:

allghifari.farhan@gmail.com

## What Needs to be Included

To help us resolve this issue quickly, please include as much information as possible:
1. Clear Description: An explanation of the vulnerability.
2. Reproduction Steps: The exact steps to trigger the vulnerability.
3. Impact: What an attacker could do with this vulnerability.
4. Screenshots or Video: If possible, to demonstrate the issue.

### Vulnerabilities Focus Area
Based on the project architecture (Firebase Auth, Firestore, and admin pages), we are particularly interested in reports related to:
1. Firebase Security Rules: A flaw in the Firestore Security Rules configuration that allows unauthorized users to access (read/write) data.
2. Cross-Site Scripting (XSS): XSS vulnerabilities, particularly in:
   The comment feature on the news-detail.html page (due to content rendered from news-detail.js).
   Rendering of news content input from admin.html (such as News Content or Hero Title).
4. Admin Authentication: Authentication bypass or privilege escalation issues on login.html or admin.html.
