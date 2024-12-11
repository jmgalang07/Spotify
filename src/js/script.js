document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "http://informatica.iesalbarregas.com:7007/songs";
  const selectedSongTitle = document.getElementById("selected-song-title");
  const selectedArtist = document.getElementById("selected-artist");
  const playPauseButton = document.querySelector(
    'box-icon[name="play-circle"]'
  );
  const playPauseTextButton = document.querySelector(".pause");
  const volumeInput = document.getElementById("volume");
  const skipPreviousButton = document.querySelector(
    'box-icon[name="skip-previous"]'
  );
  const skipNextButton = document.querySelector('box-icon[name="skip-next"]');
  const repeatButton = document.querySelector('box-icon[name="repeat"]');
  const shuffleButton = document.querySelector('box-icon[name="shuffle"]');
  const progressBar = document.getElementById("progress");
  const currentTimeDisplay = document.querySelector(
    ".progress-container .time:first-child"
  );
  const totalTimeDisplay = document.querySelector(
    ".progress-container .time:last-child"
  );

  let currentAudio = null;
  let isPlaying = false;
  let currentSongIndex = 0;
  let songs = [];
  let isRepeat = false;
  let isShuffle = false;

  currentTimeDisplay.textContent = "0:00";

  const getFavoritesFromLocalStorage = () => {
    return JSON.parse(localStorage.getItem("favorites")) || [];
  };

  const saveFavoritesToLocalStorage = (favorites) => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  };

  let favorites = getFavoritesFromLocalStorage();

  const updatePlayPauseState = () => {
    if (isPlaying) {
      playPauseButton.setAttribute("name", "pause-circle");
      playPauseTextButton.textContent = "PAUSE";
    } else {
      playPauseButton.setAttribute("name", "play-circle");
      playPauseTextButton.textContent = "PLAY";
    }
  };

  const handlePlayPause = () => {
    if (currentAudio) {
      if (isPlaying) {
        currentAudio.pause();
      } else {
        currentAudio.play();
      }
      isPlaying = !isPlaying;
      updatePlayPauseState();
    }
  };

  const bindPlayPauseEvents = (element) => {
    element.addEventListener("click", (event) => {
      event.stopPropagation();
      handlePlayPause();
    });
  };

  bindPlayPauseEvents(playPauseButton);
  bindPlayPauseEvents(playPauseTextButton);

  const actualizarImagen = (imagenUrl) => {
    const imagenContenedor = document.querySelector(".imagen");
    imagenContenedor.innerHTML = `<img src="${imagenUrl}" alt="Imagen del álbum" class="cover-img" />`;
  };

  const reproducirCancion = (url, imagenUrl, title, artist, fila) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    currentAudio = new Audio(url);
    currentAudio.volume = volumeInput.value / 100;

    currentAudio.play();
    isPlaying = true;
    updatePlayPauseState();

    actualizarImagen(imagenUrl);
    selectedSongTitle.textContent = title || "Sin título";
    selectedArtist.textContent = artist || "Desconocido";

    const filas = document.querySelectorAll("#musicTable tr");
    filas.forEach((filaItem) => (filaItem.style.backgroundColor = ""));
    fila.style.backgroundColor = "#818181";

    totalTimeDisplay.textContent = "0:00";

    currentAudio.addEventListener("loadedmetadata", () => {
      const duracionSegundos = currentAudio.duration || 0;
      const minutos = Math.floor(duracionSegundos / 60);
      const segundos = Math.floor(duracionSegundos % 60);
      const duracion = `${minutos}:${segundos < 10 ? "0" : ""}${segundos}`;
      totalTimeDisplay.textContent = duracion;
    });

    currentAudio.addEventListener("timeupdate", () => {
      if (currentAudio.duration) {
        const progressValue =
          (currentAudio.currentTime / currentAudio.duration) * 100;
        progressBar.value = progressValue;
      }
    });

    currentAudio.addEventListener("ended", () => {
      if (isRepeat) {
        currentAudio.currentTime = 0;
        currentAudio.play();
      } else if (isShuffle) {
        reproducirCancionAleatoria();
      } else {
        skipToNext();
      }
    });

    progressBar.addEventListener("input", () => {
      if (currentAudio) {
        const seekTime = (progressBar.value / 100) * currentAudio.duration;
        currentAudio.currentTime = seekTime;
      }
    });
  };

  const skipToPrevious = () => {
    currentSongIndex =
      currentSongIndex === 0 ? songs.length - 1 : currentSongIndex - 1;
    const cancion = songs[currentSongIndex];
    reproducirCancion(
      cancion.filepath,
      cancion.cover,
      cancion.title,
      cancion.artist,
      document.querySelector(
        `#musicTable tr:nth-child(${currentSongIndex + 1})`
      )
    );
  };

  const skipToNext = () => {
    currentSongIndex =
      currentSongIndex === songs.length - 1 ? 0 : currentSongIndex + 1;
    const cancion = songs[currentSongIndex];
    reproducirCancion(
      cancion.filepath,
      cancion.cover,
      cancion.title,
      cancion.artist,
      document.querySelector(
        `#musicTable tr:nth-child(${currentSongIndex + 1})`
      )
    );
  };

  skipPreviousButton.addEventListener("click", skipToPrevious);
  skipNextButton.addEventListener("click", skipToNext);

  repeatButton.addEventListener("click", () => {
    isRepeat = !isRepeat;

    if (isRepeat) {
      isShuffle = false; // Desactivar shuffle si repeat está activo
      shuffleButton.setAttribute("color", "#ffffff");
      shuffleButton.style.fill = "#ffffff";
    }

    repeatButton.setAttribute("color", isRepeat ? "#1db954" : "#ffffff");
    repeatButton.style.fill = isRepeat ? "#1db954" : "#ffffff";
  });

  shuffleButton.addEventListener("click", () => {
    isShuffle = !isShuffle;

    if (isShuffle) {
      isRepeat = false; // Desactivar repeat si shuffle está activo
      repeatButton.setAttribute("color", "#ffffff");
      repeatButton.style.fill = "#ffffff";
    }

    shuffleButton.setAttribute("color", isShuffle ? "#1db954" : "#ffffff");
    shuffleButton.style.fill = isShuffle ? "#1db954" : "#ffffff";
  });

  const reproducirCancionAleatoria = () => {
    if (songs.length > 0) {
      currentSongIndex = Math.floor(Math.random() * songs.length);
      const cancion = songs[currentSongIndex];
      reproducirCancion(
        cancion.filepath,
        cancion.cover,
        cancion.title,
        cancion.artist,
        document.querySelector(
          `#musicTable tr:nth-child(${currentSongIndex + 1})`
        )
      );
    }
  };

  const cargarCanciones = async (filter = "Todos") => {
    try {
      const response = await fetch(apiUrl);
      if (!response.ok)
        throw new Error(`Error al obtener datos: ${response.statusText}`);

      songs = await response.json();
      const tabla = document.getElementById("musicTable");
      tabla.innerHTML = "";

      for (const cancion of songs) {
        if (
          filter === "Favoritos" &&
          !favorites.some((fav) => fav.id === cancion.id)
        )
          continue;

        const fila = document.createElement("tr");

        const audio = new Audio(cancion.filepath);
        audio.addEventListener("loadedmetadata", () => {
          const duracionSegundos = audio.duration || 0;
          const minutos = Math.floor(duracionSegundos / 60);
          const segundos = Math.floor(duracionSegundos % 60);
          const duracion = `${minutos}:${segundos < 10 ? "0" : ""}${segundos}`;

          fila.dataset.id = cancion.id;
          fila.innerHTML = `
            <td class="button-column">
              <button class="action-button">
                <box-icon name='right-arrow' type='solid' color='#ffffff'></box-icon>
              </button>
            </td>
            <td>${cancion.title || "Sin título"}</td>
            <td>${cancion.artist || "Desconocido"}</td>
            <td>${duracion}</td>
            <td>
              <box-icon name="heart" type="${
                favorites.some((fav) => fav.id === cancion.id)
                  ? "solid"
                  : "regular"
              }" color="#1db954"></box-icon>
            </td>
          `;

          const reproducir = () => {
            currentSongIndex = songs.indexOf(cancion);
            reproducirCancion(
              cancion.filepath,
              cancion.cover,
              cancion.title,
              cancion.artist,
              fila
            );
          };

          fila
            .querySelector(".action-button")
            .addEventListener("click", (event) => {
              reproducir();
              event.stopPropagation();
            });

          fila.addEventListener("click", reproducir);

          const corazon = fila.querySelector('box-icon[name="heart"]');
          corazon.addEventListener("click", (event) => {
            const icon = event.target;
            const isFavorite = favorites.some((fav) => fav.id === cancion.id);

            if (isFavorite) {
              favorites = favorites.filter((fav) => fav.id !== cancion.id);
              icon.setAttribute("type", "regular");
            } else {
              favorites.push(cancion);
              icon.setAttribute("type", "solid");
            }
            saveFavoritesToLocalStorage(favorites);
            event.stopPropagation();
          });

          tabla.appendChild(fila);
        });
      }
    } catch (error) {
      console.error("Error al cargar las canciones:", error);
    }
  };

  const filtroOptions = document.querySelector(".filtro-options");
  filtroOptions.addEventListener("click", (e) => {
    if (e.target.classList.contains("filtro-option")) {
      const filtroSeleccionado = e.target.dataset.value;
      document.querySelector(".filtro-selected").textContent =
        filtroSeleccionado;
      cargarCanciones(filtroSeleccionado);
    }
  });

  volumeInput.addEventListener("input", () => {
    if (currentAudio) {
      currentAudio.volume = volumeInput.value / 100;
    }
  });

  cargarCanciones();
});

/*------------------------------------------------------------------------------------------------------------*/

//Filtros
document.addEventListener("DOMContentLoaded", () => {
  const filtroDropdown = document.querySelector(".filtro-dropdown");
  const filtroOptions = document.querySelector(".filtro-options");

  filtroDropdown.addEventListener("click", () => {
    const isOptionsVisible = filtroOptions.style.display === "block";
    filtroOptions.style.display = isOptionsVisible ? "none" : "block";
  });
  filtroOptions.addEventListener("click", (e) => {
    if (e.target.classList.contains("filtro-option")) {
      const selectedText = e.target.textContent;
      document.querySelector(".filtro-selected").textContent = selectedText;
      filtroOptions.style.display = "none";
    }
  });
});

/*------------------------------------------------------------------------------------------------------------*/

//Mostrar form
document.addEventListener("DOMContentLoaded", () => {
  const formContainer = document.querySelector(".form-container");
  const modalContent = document.querySelector(".modal-content");
  const showFormIcon = document.getElementById("showFormIcon");
  const closeFormIcon = document.getElementById("closeFormIcon");

  // Mostrar formulario con animación
  showFormIcon.addEventListener("click", () => {
    formContainer.classList.remove("oculto");
    formContainer.classList.add("mostrar");
  });

  // Cerrar formulario con el ícono de la "x"
  closeFormIcon.addEventListener("click", () => {
    formContainer.classList.remove("mostrar");
    formContainer.classList.add("oculto");
  });

  // Cerrar formulario al hacer clic fuera de la ventana modal
  window.addEventListener("click", (event) => {
    if (
      formContainer.classList.contains("mostrar") &&
      !modalContent.contains(event.target) &&
      event.target !== showFormIcon
    ) {
      formContainer.classList.remove("mostrar");
      formContainer.classList.add("oculto");
    }
  });
});

/*------------------------------------------------------------------------------------------------------------*/

//Cambiar iconos segun el volumen
document.addEventListener("DOMContentLoaded", function () {
  const volumeInput = document.getElementById("volume");
  const volumeIcon = document.getElementById("volumeIcon");
  const showFormBtn = document.getElementById("showFormBtn");
  const formContainer = document.getElementById("formContainer");

  const updateVolumeIcon = () => {
    const volumeValue = volumeInput.value;
    if (volumeValue == 0) {
      volumeIcon.setAttribute("name", "volume-mute");
    } else if (volumeValue > 0 && volumeValue < 100) {
      volumeIcon.setAttribute("name", "volume-low");
    } else if (volumeValue == 100) {
      volumeIcon.setAttribute("name", "volume-full");
    }
  };

  volumeInput.addEventListener("input", updateVolumeIcon);

  const showForm = () => {
    formContainer.style.display = "block";
  };

  showFormBtn.addEventListener("click", showForm);
});

/*------------------------------------------------------------------------------------------------------------*/
/*Subir canción*/
document.addEventListener("DOMContentLoaded", () => {
  const uploadForm = document.getElementById("uploadForm");
  const uploadModal = document.getElementById("uploadModal");
  const closeFormIcon = document.getElementById("closeFormIcon");

  // Event listener para el botón de cierre del modal
  closeFormIcon.addEventListener("click", () => {
    uploadModal.classList.remove("mostrar");
    uploadModal.classList.add("oculto");
    uploadForm.reset();
  });

  // Función para manejar el envío del formulario
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(uploadForm);
    const apiUrl = "http://informatica.iesalbarregas.com:7007/upload";

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Canción subida con éxito:", result);
        alert("¡Canción subida con éxito!");
        uploadForm.reset();
        uploadModal.classList.remove("mostrar");
        uploadModal.classList.add("oculto");
        await cargarCanciones(); // Cargar canciones actualizadas
      } else {
        const error = await response.text();
        console.error("Error del servidor:", error);
        alert("Error al subir la canción. Por favor, inténtalo de nuevo.");
      }
    } catch (error) {
      console.error("Error al subir la canción:", error);
      alert("Error al subir la canción. Por favor, verifica tu conexión.");
    }
  };

  uploadForm.addEventListener("submit", handleFormSubmit);

  // Función para cargar las canciones después de subir una nueva canción
  const cargarCanciones = async () => {
    try {
      const response = await fetch(
        "http://informatica.iesalbarregas.com:7007/songs"
      );
      if (response.ok) {
        const songs = await response.json();
        console.log("Canciones cargadas:", songs);
        // Aquí puedes actualizar la tabla o lista de canciones, por ejemplo:
        actualizarListaCanciones(songs);
      } else {
        console.error("Error al cargar las canciones:", response.statusText);
      }
    } catch (error) {
      console.error("Error al cargar las canciones:", error);
    }
  };

  // Función para actualizar la tabla o lista de canciones
  const actualizarListaCanciones = (songs) => {
    const songList = document.getElementById("songList"); // Asegúrate de tener un contenedor con este ID
    songList.innerHTML = ""; // Limpiar lista previa
    songs.forEach((song) => {
      const listItem = document.createElement("li");
      listItem.textContent = `${song.title} - ${song.artist}`;
      songList.appendChild(listItem);
    });
  };
});

/*------------------------------------------------------------------------------------------------------------*/
