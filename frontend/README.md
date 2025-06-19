1. Solo uno del equipo debe hacerlo (YA ESTÁ HECHO)

    git checkout -b develop                  # Crear la rama develop desde main
    git push origin develop                  # Subir develop a GitHub

2. Crea tu propia rama desde develop (RECORDAR HACERLO DESDE LA CARPETA DE QUEPOTEAM, PARA SUBIR CAMBIOS DEL BACK Y FRONT)

    git checkout develop                     # Cambiar a develop
    git pull origin develop                  # Asegurarse de tener la última versión
    git checkout -b crisDevelop  # Crear tu nueva rama

3. Trabajar y guardar los cambios

    git add .                                # Añadir todos los archivos modificados
    git commit -m "feat: agregado login"     # Crear un commit con un mensaje claro
    git push origin crisDevelop  # Subir la rama a GitHub

4. Hacer Pull Request a develop desde GitHub (Realizar lo mismo desde develop a main)
    - Ve a GitHub.

    - Haz clic en “Compare & pull request”.

    - Asegúrate de que sea de (crisDevelop)... hacia develop.    (base: develop  <-  compare:crisDevelop)

    - Escribe un título y descripción clara.

    - Crea el PR.

    - El otro revisa y aprueba.

5. Probar e integrar en develop (Realizar lo mismo desde develop a main)
    - Una vez el Pull Request se aprueba, se hace merge a develop.
            🧩 Antes de hacer merge, se recomienda:

                Revisar el código.

                Comprobar si GitHub indica conflictos.

                Probar localmente (opcional, si el cambio es grande).

                Si todo está OK, seguimos.

            🔁 Hacer el merge desde GitHub

                ✅ Merge pull request

                Luego haz clic en:Confirm merge

                Opcionalmente, borra la rama crisDevelop, (No es nuestra idea, siempre trabajaremos en nuestra rama)

                ¡Ya está integrado en develop!
    - Nunca trabajes directamente en develop, solo recibe cambios por PR.

    - Descartamos los cambios de crisDevelop, y cambiamos a develop:

        (Descartamos los cambios porque ya estan guardados en develop, en caso de tener cosas nuevas, abria que stashear esos cambios)
        git restore frontend/README.md
        git checkout develop

6. Para traer los cambios del repositorio a nuestra rama:
    - asegurate de estar en tu rama en local
        git checkout crisDevelop
    - Trae los ultimos cambios del repositorio remoto
        git fetch origin
    - Haz el merge del repositorio a tu rama local:
        git merge origin/main      #o lo que queramos coger, por ejemplo,  en develop: git merge origin/develop

######

# En el servidor
    ssh cristian@109.205.183.241
    cd ~/quepoteam
<!-- Eliminar tus cambios locales y archivos no versionados que bloquean el pull
Ten cuidado, esto borra TODO local que no esté en el repo remoto. -->

# Limpia los cambios en tracked files
    git reset --hard

# Borra archivos no versionados y directorios (como frontend/.env)
    git clean -fd
<!-- Ahora sí, puedes hacer pull sin problemas -->
    git pull origin master


//DOCKER
# Parar todo
docker-compose down

# Limpiar imágenes viejas
docker-compose down --rmi all

# Limpiar cache de build
docker builder prune -a

# Reconstruir desde cero
docker-compose up --build
<!--Para dejarlo corriendo en segundo plano-->
docker-compose up --build -d


######

# Para parar el servidor:
<!-- Si tienes el comando corriendo en la terminal, solo tienes que hacer: -->
Ctrl + C
<!-- Esto detiene los contenedores levantados por docker-compose up. -->

<!-- Si lo dejaste corriendo en segundo plano (con -d, modo "detached"), entonces: -->

docker-compose down
<!-- Esto detiene y elimina los contenedores, pero NO borra tus volúmenes o imágenes. -->

# Para volver a arrancar el servidor:
<!-- Si ya construiste con --build una vez, ya no necesitas hacerlo de nuevo a menos que hayas cambiado el Dockerfile u otra configuración. Puedes simplemente hacer: -->
docker-compose up

# Si hiciste cambios y quieres reconstruir:

docker-compose up --build