@echo off
echo Cole sua chave OpenAI abaixo (substitua o texto entre aspas) e salve o arquivo.
echo Depois, execute este arquivo no terminal: .\setup_openai.bat

firebase functions:config:set openai.key="COLE_SUA_CHAVE_AQUI"
