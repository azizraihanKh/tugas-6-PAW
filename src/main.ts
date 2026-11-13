
import './style.css'
import type { Task, TaskStatus } from './types/task'

const appName: string = import.meta.env.VITE_APP_NAME
const appVersion: string = import.meta.env.VITE_APP_VERSION

// Mengambil data tugas dari localStorage
function loadTasks(): Task[] {
  const savedTasks: string | null = localStorage.getItem('tasks')

  if (savedTasks) {
    try {
      const parsedTasks = JSON.parse(savedTasks) as Task[]

      return parsedTasks.map(task => ({
        ...task,
        course: task.course ?? 'Belum ditentukan'
      }))
    } catch {
      return []
    }
  }

  // Data contoh tugas
  const initialTasks: Task[] = [
    {
      id: 1,
      course: 'Pengembangan Aplikasi Web',
      title: 'Pembuatan Halaman Profil',
      description: 'Membuat halaman profil diri menggunakan HTML5 Semantik.',
      deadline: '2026-09-18',
      resultLink: 'https://raihankhoirulaziz.space/profil.html'
    }
  ]

  localStorage.setItem('tasks', JSON.stringify(initialTasks))

  return initialTasks
}


let tasks: Task[] = loadTasks()
let editingTaskId: number | null = null
let completingTaskId: number | null = null
let isAddingTask: boolean = false
let searchQuery: string = ''

// Menyimpan data tugas
function saveTasks(): void {
  localStorage.setItem('tasks', JSON.stringify(tasks))
}

// Mengamankan teks sebelum ditampilkan di HTML
function escapeHTML(value: string): string {
  return value.replace(/[&<>"']/g, character => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }

    return entities[character]
  })
}

// Memeriksa validitas link
function isValidUrl(link?: string): boolean {
  if (!link) return false

  try {
    const url = new URL(link)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// Menentukan status tugas
function getTaskStatus(task: Task): TaskStatus {
  return isValidUrl(task.resultLink) ? 'Selesai' : 'Belum Selesai'
}

// Format tanggal
function formatDate(date: string): string {
  if (!date) return '-'

  const [year, month, day] = date.split('-')
  return `${day}-${month}-${year}`
}

// Memfilter tugas berdasarkan pencarian
function filterTasks(taskList: Task[], keyword: string): Task[] {
  const search: string = keyword.toLowerCase().trim()

  if (!search) return taskList

  return taskList.filter(task =>
    task.title.toLowerCase().includes(search) ||
    task.course.toLowerCase().includes(search) ||
    task.description.toLowerCase().includes(search)
  )
}

// Menampilkan aplikasi
function renderTasks(): void {
  const totalTasks: number = tasks.length

  const unfinishedTasks: number = tasks.filter(
    task => getTaskStatus(task) === 'Belum Selesai'
  ).length

  const completedTasks: number = tasks.filter(
    task => getTaskStatus(task) === 'Selesai'
  ).length

  const filteredTasks: Task[] = filterTasks(tasks, searchQuery)

  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <header class="app-header">
      <div>
        <h1>${escapeHTML(appName)}</h1>
        <p>Versi ${escapeHTML(appVersion)}</p>
      </div>
    </header>

    <section class="summary">
      <div class="summary-card total">
        <p>Total Tugas</p>
        <h2>${totalTasks}</h2>
      </div>

      <div class="summary-card unfinished">
        <p>Belum Selesai</p>
        <h2>${unfinishedTasks}</h2>
      </div>

      <div class="summary-card completed">
        <p>Selesai</p>
        <h2>${completedTasks}</h2>
      </div>
    </section>

    <div class="task-header">
      <h2>Daftar Tugas</h2>

      <button
        type="button"
        id="add-task-btn"
        class="btn-primary"
        ${isAddingTask ? 'hidden' : ''}
      >
        + Tambah Tugas
      </button>
    </div>

    <!-- Pencarian Tugas -->
    ${tasks.length > 0 ? `
      <div class="search-container">
        <input
          type="search"
          id="task-search"
          class="search-input"
          placeholder="Cari nama tugas, mata kuliah, atau deskripsi..."
          value="${escapeHTML(searchQuery)}"
        >
      </div>
    ` : ''}

    <!-- Form Tambah Tugas -->
    <form
      id="task-form"
      class="task-form"
      ${isAddingTask ? '' : 'hidden'}
    >
      <h3>Tambah Tugas Baru</h3>

      <label for="task-course">Mata Kuliah</label>
      <input
        type="text"
        id="task-course"
        name="course"
        placeholder="Masukkan nama mata kuliah"
        required
      >

      <label for="task-title">Nama Tugas</label>
      <input
        type="text"
        id="task-title"
        name="title"
        placeholder="Masukkan nama tugas"
        required
      >

      <label for="task-description">Deskripsi</label>
      <textarea
        id="task-description"
        name="description"
        placeholder="Masukkan deskripsi tugas"
        required
      ></textarea>

      <label for="task-deadline">Deadline</label>
      <input
        type="date"
        id="task-deadline"
        name="deadline"
        required
      >

      <div class="form-actions">
        <button
          type="button"
          id="cancel-task-btn"
          class="btn-secondary"
        >
          Batal
        </button>

        <button type="submit" class="btn-primary">
          Simpan Tugas
        </button>
      </div>
    </form>

    <!-- Daftar Tugas -->
    <ul class="task-list">
      ${tasks.length === 0 ? `
        <li class="empty-state">
          <p>Belum ada tugas.</p>
          <span>Tambahkan tugas kuliah pertamamu!</span>
        </li>
      ` : filteredTasks.length === 0 ? `
        <li class="search-empty">
          <p>Tugas tidak ditemukan.</p>
          <span>Coba gunakan kata kunci pencarian lainnya.</span>
        </li>
      ` : filteredTasks.map(task => `
        <li class="task-card">

          ${editingTaskId === task.id ? `
            <!-- Form Edit Tugas -->
            <form
              class="inline-edit-form"
              data-edit-form="${task.id}"
            >
              <h3>Edit Tugas</h3>

              <label for="edit-course-${task.id}">Mata Kuliah</label>
              <input
                type="text"
                id="edit-course-${task.id}"
                name="course"
                value="${escapeHTML(task.course)}"
                required
              >

              <label for="edit-title-${task.id}">Nama Tugas</label>
              <input
                type="text"
                id="edit-title-${task.id}"
                name="title"
                value="${escapeHTML(task.title)}"
                required
              >

              <label for="edit-description-${task.id}">Deskripsi</label>
              <textarea
                id="edit-description-${task.id}"
                name="description"
                required
              >${escapeHTML(task.description)}</textarea>

              <label for="edit-deadline-${task.id}">Deadline</label>
              <input
                type="date"
                id="edit-deadline-${task.id}"
                name="deadline"
                value="${escapeHTML(task.deadline)}"
                required
              >

              <div class="form-actions">
                <button
                  type="button"
                  class="btn-secondary"
                  data-cancel-edit="${task.id}"
                >
                  Batal
                </button>

                <button type="submit" class="btn-primary">
                  Simpan Perubahan
                </button>
              </div>
            </form>

          ` : `
            <!-- Informasi Tugas -->
            <div class="task-card-header">
              <div>
                <p class="task-course">
                  ${escapeHTML(task.course)}
                </p>

                <h3>${escapeHTML(task.title)}</h3>
              </div>

              <span class="status-badge ${
                getTaskStatus(task) === 'Selesai'
                  ? 'status-completed'
                  : 'status-unfinished'
              }">
                ${getTaskStatus(task)}
              </span>
            </div>

            <p class="task-description">
              ${escapeHTML(task.description)}
            </p>

            <!-- Bagian Bawah Kartu -->
            <div class="task-footer">
              <p>
                <span>Deadline</span>
                ${formatDate(task.deadline)}
              </p>

              <div class="task-actions">
                <button
                  type="button"
                  class="btn-edit"
                  data-edit-id="${task.id}"
                  aria-label="Edit tugas"
                  title="Edit tugas"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                  </svg>
                </button>

                <button
                  type="button"
                  class="btn-delete"
                  data-delete-id="${task.id}"
                  aria-label="Hapus tugas"
                  title="Hapus tugas"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v5" />
                    <path d="M14 11v5" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Form Link Hasil -->
            ${completingTaskId === task.id ? `
              <form
                class="complete-form"
                data-complete-form="${task.id}"
              >
                <h3>Masukkan Link Hasil</h3>

                <p class="form-info">
                  Tambahkan link hasil tugas untuk mengubah status menjadi Selesai.
                </p>

                <label for="result-link-${task.id}">
                  Link Hasil Tugas
                </label>

                <input
                  type="url"
                  id="result-link-${task.id}"
                  name="resultLink"
                  placeholder="https://contoh.com/hasil-tugas"
                  required
                >

                <div class="form-actions">
                  <button
                    type="button"
                    class="btn-secondary"
                    data-cancel-complete="${task.id}"
                  >
                    Batal
                  </button>

                  <button type="submit" class="btn-primary">
                    Simpan Link
                  </button>
                </div>
              </form>

            ` : isValidUrl(task.resultLink) ? `
              <a
                href="${escapeHTML(task.resultLink!)}"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-result"
              >
                <span>↗</span> Lihat Hasil
              </a>

            ` : `
              <button
                type="button"
                class="btn-complete"
                data-complete-id="${task.id}"
              >
                ✓ Tandai Selesai
              </button>
            `}
          `}
        </li>
      `).join('')}
    </ul>
  `

  // Pencarian tugas
  const searchInput = document.querySelector<HTMLInputElement>(
    '#task-search'
  )

  searchInput?.addEventListener('input', () => {
    const cursorPosition = searchInput.selectionStart ?? searchInput.value.length

    searchQuery = searchInput.value
    renderTasks()

    const updatedInput = document.querySelector<HTMLInputElement>(
      '#task-search'
    )

    updatedInput?.focus()
    updatedInput?.setSelectionRange(cursorPosition, cursorPosition)
  })

  // Tombol tambah tugas
  const addTaskBtn = document.querySelector<HTMLButtonElement>(
    '#add-task-btn'
  )

  addTaskBtn?.addEventListener('click', () => {
    isAddingTask = true
    renderTasks()
  })

  // Membatalkan tambah tugas
  const cancelTaskBtn = document.querySelector<HTMLButtonElement>(
    '#cancel-task-btn'
  )

  cancelTaskBtn?.addEventListener('click', () => {
    isAddingTask = false
    renderTasks()
  })

  // Menyimpan tugas baru
  const taskForm = document.querySelector<HTMLFormElement>('#task-form')

  taskForm?.addEventListener('submit', (event: SubmitEvent) => {
    event.preventDefault()

    const formData = new FormData(taskForm)

    const newTask: Task = {
      id: Date.now(),
      course: String(formData.get('course')).trim(),
      title: String(formData.get('title')).trim(),
      description: String(formData.get('description')).trim(),
      deadline: String(formData.get('deadline'))
    }

    tasks.push(newTask)

    isAddingTask = false
    searchQuery = ''
    saveTasks()
    renderTasks()
  })

  // Membuka form edit
  const editButtons = document.querySelectorAll<HTMLButtonElement>(
    '.btn-edit'
  )

  editButtons.forEach(button => {
    button.addEventListener('click', () => {
      editingTaskId = Number(button.dataset.editId)
      completingTaskId = null
      renderTasks()
    })
  })

  // Membatalkan edit
  const cancelEditButtons = document.querySelectorAll<HTMLButtonElement>(
    '[data-cancel-edit]'
  )

  cancelEditButtons.forEach(button => {
    button.addEventListener('click', () => {
      editingTaskId = null
      renderTasks()
    })
  })

  // Menyimpan perubahan tugas
  const editForms = document.querySelectorAll<HTMLFormElement>(
    '[data-edit-form]'
  )

  editForms.forEach(editForm => {
    editForm.addEventListener('submit', (event: SubmitEvent) => {
      event.preventDefault()

      const taskId = Number(editForm.dataset.editForm)
      const formData = new FormData(editForm)

      const course = String(formData.get('course')).trim()
      const title = String(formData.get('title')).trim()
      const description = String(formData.get('description')).trim()
      const deadline = String(formData.get('deadline'))

      tasks = tasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            course,
            title,
            description,
            deadline
          }
        }

        return task
      })

      editingTaskId = null
      saveTasks()
      renderTasks()
    })
  })

  // Membuka form Tandai Selesai
  const completeButtons = document.querySelectorAll<HTMLButtonElement>(
    '.btn-complete'
  )

  completeButtons.forEach(button => {
    button.addEventListener('click', () => {
      completingTaskId = Number(button.dataset.completeId)
      renderTasks()
    })
  })

  // Membatalkan Tandai Selesai
  const cancelCompleteButtons = document.querySelectorAll<HTMLButtonElement>(
    '[data-cancel-complete]'
  )

  cancelCompleteButtons.forEach(button => {
    button.addEventListener('click', () => {
      completingTaskId = null
      renderTasks()
    })
  })

  // Menyimpan link hasil tugas
  const completeForms = document.querySelectorAll<HTMLFormElement>(
    '[data-complete-form]'
  )

  completeForms.forEach(completeForm => {
    completeForm.addEventListener('submit', (event: SubmitEvent) => {
      event.preventDefault()

      const taskId = Number(completeForm.dataset.completeForm)
      const formData = new FormData(completeForm)
      const resultLink = String(formData.get('resultLink')).trim()

      if (!isValidUrl(resultLink)) {
        alert('Masukkan link HTTP atau HTTPS yang valid.')
        return
      }

      tasks = tasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            resultLink
          }
        }

        return task
      })

      completingTaskId = null
      saveTasks()
      renderTasks()
    })
  })

  // Menghapus tugas
  const deleteButtons = document.querySelectorAll<HTMLButtonElement>(
    '.btn-delete'
  )

  deleteButtons.forEach(button => {
    button.addEventListener('click', () => {
      const taskId = Number(button.dataset.deleteId)

      const confirmed = confirm(
        'Apakah kamu yakin ingin menghapus tugas ini?'
      )

      if (!confirmed) return

      tasks = tasks.filter(task => task.id !== taskId)

      saveTasks()
      renderTasks()
    })
  })
}

// Menampilkan aplikasi pertama kali
renderTasks()
