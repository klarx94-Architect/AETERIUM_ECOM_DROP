@echo off
timeout /t 75 /nobreak > nul
curl -s -o NUL -w "STATUS_PRODUCTS:%%{http_code}\n" https://aeterium-ecom-drop.vercel.app/api/products
curl -s -o NUL -w "STATUS_INTEL:%%{http_code}\n" https://aeterium-ecom-drop.vercel.app/api/guerrilla-intel
