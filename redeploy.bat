@echo off
curl -s -X POST "https://api.vercel.com/v13/deployments?teamId=team_h4JhRvWvayMJYeKS0fRwU48u&forceNew=1" -H "Authorization: Bearer vca_7xIVV5eqvvl0j9Jo6WM4fu5ewYb8zlihyewRzz87DHKXBMb37h2Afsic" -H "Content-Type: application/json" -d "{\"name\":\"aeterium-ecom-drop\",\"gitSource\":{\"type\":\"github\",\"repoId\":1195565653,\"ref\":\"main\"}}"
