const idField = document.getElementById('id')
const tasField = document.getElementById('tas')
const höheField = document.getElementById('hoehe')
const seitenField = document.getElementById('seiten')
const typFields = Array.from(document.getElementsByName('typ'))

const startButton = document.getElementById('start')
const pauseButton = document.getElementById('pause')
const stopButton = document.getElementById('stop')
const downloadButton = document.getElementById('download')
const deleteButton = document.getElementById('delete')

const timesList = document.getElementById('times')
const durationList = document.getElementById('duration')
const typeList = document.getElementById('type')
const currentList = document.getElementById('current')
const resultList = document.getElementById('result')

const M = {
  start: [],
  stop: []
}

const CSV = []

const getDateStamp = () => {
  const date = new Date()
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`
}

const getWeekNumber = () => {
  var d = new Date();
  var dayNum = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - dayNum);
  var yearStart = new Date(d.getFullYear(),0,4);
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7)
};

const getTimeStamp = (date) => {
  return `${date.getHours()}:${date.getMinutes()}`
}

const getDuration = () => {
  const stop = [...M.stop]
  let duration = 0
  while (M.start.length > stop.length) {
    stop.push(new Date())
  }
  M.start.forEach((d, i) => duration += (stop[i].getTime() - d.getTime()) / 60000)
  return `${Math.floor(duration / 60).toString().padStart(2, '0')}:${Math.ceil(duration % 60).toString().padStart(2, '0')}`
}

const recalulate = () => {
  const result = {
    datum: getDateStamp(),
    id: idField.value || '',
    typ: typFields.find(r => r.checked)?.value || '',
    tas: +tasField.value || '',
    höhe: +höheField.value || '',
    seiten: +seitenField.value || '',
    time: getDuration(),
    kw: getWeekNumber(),
  }

  localStorage.setItem('scanner_tracker_fields', JSON.stringify([ result.id, result.typ, result.tas, result.höhe, result.seiten ]))

  let bool = false
  switch (result.time && result.typ) {
    case 'Dossier Vorbereiten':
    case 'Qualitätsprüfung':
    case 'Korrekturen':
    case 'Reponieren':
      bool = (result.time && result.id && result.typ && result.höhe && result.tas)
      break;
    case 'Scanning (Kodak)':
    case 'Scanning (Microbox)':
    case '100% Kontrolle':
      bool = (result.time && result.id && result.typ && result.höhe && result.tas && result.seiten)
      break;
    case 'Dossier Prüfen':
      bool = (result.time && result.id && result.typ && result.höhe)
      break;
    default:
      break;
  }
  if (bool) {
    stopButton.addEventListener('click', stop)
    stopButton.removeAttribute('disabled')
  } else {
    stopButton.removeEventListener('click', stop)
    stopButton.setAttribute('disabled', 'disabled')
  }

  const csv = Object.values(result).join(';') + ';'
  typeList.innerHTML = result.typ || '<i>kein Typ ausgewählt</i>'
  durationList.innerText = result.time
  currentList.innerText = `${result.datum} (KW ${result.kw})`
  timesList.innerText = (M.start.length ? M.start.map((s, i) => `${getTimeStamp(s)} → ${M.stop[i] ? getTimeStamp(M.stop[i]) : '--:--'}`).join(', ') : '--:-- → --:--')
  resultList.innerText = localStorage.getItem('scanner_tracker')
  return csv
}

function start () {
  M.start.push(new Date())
  localStorage.setItem('scanner_tracker_current', JSON.stringify(M))
  recalulate()

  startButton.hidden = true
  pauseButton.hidden = false

  startButton.removeEventListener('click', start)
  pauseButton.addEventListener('click', pause)
}

function pause () {
  M.stop.push(new Date())
  localStorage.setItem('scanner_tracker_current', JSON.stringify(M))
  recalulate()

  startButton.hidden = false
  pauseButton.hidden = true

  startButton.addEventListener('click', start)
  pauseButton.removeEventListener('click', pause)
}

function stop () {
  if (M.start.length < M.stop.length) M.stop.push(new Date())

  CSV.push(recalulate())
  localStorage.setItem('scanner_tracker', CSV.join('\n'));

  M.start = []
  M.stop = []
  localStorage.setItem('scanner_tracker_current', JSON.stringify(M))
  idField.value = ''
  tasField.value = ''
  höheField.value = ''
  seitenField.value = ''
  recalulate()

  startButton.hidden = false
  pauseButton.hidden = true
  downloadButton.removeAttribute('disabled')
  deleteButton.removeAttribute('disabled')

  startButton.addEventListener('click', start)
  pauseButton.removeEventListener('click', pause)
  downloadButton.addEventListener('click', download)
  deleteButton.addEventListener('click', deleteAll)
}

function deleteAll () {
  if (confirm('delete entries?')) {
    localStorage.removeItem('scanner_tracker')

    downloadButton.setAttribute('disabled', 'disabled')
    deleteButton.setAttribute('disabled', 'disabled')

    downloadButton.removeEventListener('click', download)
    deleteButton.removeEventListener('click', deleteAll)
  }
  recalulate()
}

function download () {
  const csv = localStorage.getItem('scanner_tracker')
  const link = document.createElement("a");
  const index = csv.lastIndexOf('\n')
  const date = csv.substring(index + 1, index + 11)
  link.download = date + '.csv';
  link.href = `data:text/csv,${encodeURIComponent(csv)}`;
  link.click();
  deleteAll()
}

if (localStorage.getItem('scanner_tracker')) {
  CSV.splice(0, 0, ...localStorage.getItem('scanner_tracker').split('\n'))
  console.log(CSV)

  downloadButton.removeAttribute('disabled')
  deleteButton.removeAttribute('disabled')

  downloadButton.addEventListener('click', download)
  deleteButton.addEventListener('click', deleteAll)
}

if (localStorage.getItem('scanner_tracker_current')) {
  const { start, stop } = JSON.parse(localStorage.getItem('scanner_tracker_current'))
  M.start = start.map(d => new Date(d))
  M.stop = stop.map(d => new Date(d))
  if (M.start.length > M.stop.length) {
    startButton.hidden = true
    pauseButton.hidden = false
    startButton.removeEventListener('click', start)
    pauseButton.addEventListener('click', pause)
  }
}

if (localStorage.getItem('scanner_tracker_fields')) {
  const [ id, typ, tas, höhe, seiten ] = JSON.parse(localStorage.getItem('scanner_tracker_fields'))
  idField.value = id
  typFields.find(f => f.value === typ).checked = true
  tasField.value = tas
  höheField.value = höhe
  seitenField.value = seiten
}

startButton.addEventListener('click', start)
document.addEventListener('input', recalulate)
setInterval(recalulate, 10000)
recalulate()

if (navigator?.storage?.persist) {
  navigator.storage.persist().then(b => {
    if (!b) {
      alert('Achtung: Möglicherweise werden die Daten nicht dauerhaft gespeichert.')
    }
  })
} else {
  alert('Achtung: Möglicherweise werden die Daten nicht dauerhaft gespeichert.')
}