@echo off
curl -s -X GET "https://api.vercel.com/v9/projects/prj_lYRKh1iRSajkFnY7lLU7BoYQXBxk/env?teamId=team_h4JhRvWvayMJYeKS0fRwU48u&decrypt=true" -H "Authorization: Bearer vca_7xIVV5eqvvl0j9Jo6WM4fu5ewYb8zlihyewRzz87DHKXBMb37h2Afsic" > envs_decrypted.json
