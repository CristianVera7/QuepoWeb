# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

1. Solo uno del equipo debe hacerlo (YA ESTÁ HECHO)

git checkout -b develop                  # Crear la rama develop desde main
git push origin develop                  # Subir develop a GitHub

2. Crea tu propia rama desde develop (RECORDAR HACERLO DESDE LA CARPETA DE QUEPOWEB, PARA SUBIR CAMBIOS DEL BACK Y FRONT)

git checkout develop                     # Cambiar a develop
git pull origin develop                  # Asegurarse de tener la última versión
git checkout -b feature/tu-nombre-tarea  # Crear tu nueva rama

3. Trabajar y guardar los cambios

git add .                                # Añadir todos los archivos modificados
git commit -m "feat: agregado login"     # Crear un commit con un mensaje claro
git push origin feature/tu-nombre-tarea  # Subir la rama a GitHub

4. Hacer Pull Request a develop desde GitHub
- Ve a GitHub.

- Haz clic en “Compare & pull request”.

- Asegúrate de que sea de feature/... hacia develop.

- Escribe un título y descripción clara.

- Crea el PR.

- El otro revisa y aprueba.

5. Probar e integrar en develop
- Una vez el Pull Request se aprueba, se hace merge a develop.
- Nunca trabajes directamente en develop, solo recibe cambios por PR.

6. fusionar a main

git checkout main                        # Cambia a la rama 'main' localmente, para trabajar sobre ella.
git pull origin main                     # Trae y actualiza tu rama 'main' local con la última versión del repositorio remoto.
git merge develop                        # Fusiona los cambios que están en la rama 'develop' dentro de 'main'.
git push origin main                     # Sube (push) la rama 'main' actualizada al repositorio remoto en GitHub.



