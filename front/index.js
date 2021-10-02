const idField = document.getElementById('id')
const tasField = document.getElementById('tas')
const höheField = document.getElementById('hoehe')
const seitenField = document.getElementById('seiten')
const typFields = Array.from(document.getElementsByName('typ'))
const startButton = document.getElementById('start')
const pauseButton = document.getElementById('pause')
const stopButton = document.getElementById('stop')

const fromList = document.getElementById('from')
const arrowsList = document.getElementById('arrows')
const toList = document.getElementById('to')
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
  console.log('RC', getTimeStamp(new Date()))
  fromList.innerText = M.start.map(getTimeStamp).join('\n') || '--:--'
  arrowsList.innerText = '→\n'.repeat(M.start.length || 1)
  toList.innerText = M.stop.map(getTimeStamp).join('\n') + (M.start.length > M.stop.length ? '\n--:--' : '')
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
  resultList.innerText = Object.entries(result).map(([a, b]) => `${a.padEnd(6)}: ${b}`).join('\n')
  return csv
}

function start () {
  M.start.push(new Date())
  recalulate()

  startButton.setAttribute('disabled', 'disabled')
  pauseButton.removeAttribute('disabled')

  startButton.removeEventListener('click', start)
  pauseButton.addEventListener('click', pause)
}

function pause () {
  M.stop.push(new Date())
  recalulate()

  startButton.removeAttribute('disabled')
  pauseButton.setAttribute('disabled', 'disabled')

  startButton.addEventListener('click', start)
  pauseButton.removeEventListener('click', pause)
}

function stop () {
  if (M.start.length < M.stop.length) M.stop.push(new Date())

  CSV.push(recalulate())
  localStorage.setItem('scanner_tracker', CSV.join('\n'));
  console.log(localStorage.getItem('scanner_tracker'))

  M.start = []
  M.stop = []
  idField.value = ''
  tasField.value = ''
  höheField.value = ''
  seitenField.value = ''
  recalulate()

  startButton.removeAttribute('disabled')
  pauseButton.setAttribute('disabled', 'disabled')

  startButton.addEventListener('click', start)
  pauseButton.removeEventListener('click', pause)
}

startButton.addEventListener('click', start)
document.addEventListener('change', recalulate)
setInterval(recalulate, 10000)
recalulate()