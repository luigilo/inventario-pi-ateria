// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permitir leer públicamente los archivos de productos (opcional)
    // Si prefieres restringir, cambia a: allow read: if request.auth != null;
    match /products/{productId}/{fileName} {
      allow read: if true;
      // Solo usuarios autenticados pueden subir/borrar dentro de products/
      // Además, limitamos a imágenes y a máximo 10MB
      allow write: if request.auth != null
                   && request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }

    // Denegar todo lo demás por defecto
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}

    function userRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    function isAdmin() {
      return isAuthenticated() && userRole() == "admin";
    }

    // Colección de usuarios (documentos users/{uid})
    match /users/{uid} {
      // Cualquier usuario autenticado puede leer la lista (para ver en la tabla)
      allow read: if isAuthenticated();

      // Solo admin puede crear/actualizar/eliminar documentos de usuarios
      allow create, update, delete: if isAdmin();
    }

    // Ejemplos resto del modelo
    match /products/{id} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAdmin();
    }

    match /suppliers/{id} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAdmin();
    }

    match /stock_movements/{id} {
      allow read: if isAuthenticated();
      allow create: if isAdmin()
        || (isAuthenticated()
            && userRole() == "vendedor"
            && request.resource.data.type == "out"
            && request.resource.data.userId == request.auth.uid);
      allow update, delete: if isAdmin();
    }
  }
}