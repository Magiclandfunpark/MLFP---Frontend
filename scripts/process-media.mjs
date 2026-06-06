import { mkdir, rm } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'
import sharp from 'sharp'
import ffmpegPath from 'ffmpeg-static'

const root = path.resolve(import.meta.dirname, '..')
const sourceImages = path.join(root, 'public', 'Magic Land Photos')
const sourceVideo = path.join(root, 'public', 'Magic Land Intro video.mp4')
const outputRoot = path.join(root, 'public', 'media')
const imageOutput = path.join(outputRoot, 'images')
const videoOutput = path.join(outputRoot, 'video')

const photos = [
  ['home-family', 'Inside magicland father & daughter - coverpage.jpg', 'attention'],
  ['home-bubbles', 'bubble bath at magicland cover page.jpg', 'attention'],
  ['park-sunset', 'sunset pic of magicland.jpg', 'attention'],
  ['park-location', 'Distant pic of magicland - map.jpg', 'attention'],
  ['family-rides', 'children riding & enjoying.jpg', 'attention'],
  ['self-control-ride', 'Bumble bee in magicland cover page.jpg', 'attention'],
  ['car-ride', 'Car ride 3.jpg', 'attention'],
  ['carousel-horse', 'Magicland horse riding.jpg', 'attention'],
  ['kids-play', 'kids walking in trampolin.jpg', 'attention'],
  ['trampoline', 'trampoline.jpg', 'attention'],
  ['bungee', 'kids in bungee.jpg', 'attention'],
  ['zipline', 'zipline 2.jpg', 'attention'],
  ['bubble-play', 'bubble bath.jpg', 'attention'],
  ['vr-bike', 'Motorcycle racing.jpg', 'attention'],
  ['vr-machines', 'VR Games 6 - coverpage.jpg', 'attention'],
  ['vr-car', 'VR games 4.jpg', 'attention'],
  ['shooting-game', 'shooting games.jpg', 'attention'],
  ['arcade-machines', 'VR game machine.jpg', 'attention'],
  ['rickshaw', 'Rickshaw ride.jpg', 'attention'],
  ['creative-village', 'Creative village main pic.jpg', 'attention'],
  ['creative-dress', 'creative village dress.jpg', 'attention'],
  ['pottery', 'Pottery at creative village.jpg', 'attention'],
  ['pottery-workshop', 'pottery section in creative village.jpg', 'attention'],
  ['doko-heritage', 'small baby carrying doko in creative village.jpg', 'attention'],
  ['creative-family', 'beautiful lady at creative village.jpg', 'attention'],
  ['events-stage', 'Event section in magicland.jpg', 'attention'],
  ['events-singer', 'singer performing in ml events.jpg', 'attention'],
  ['events-dj', 'dj at ml.jpg', 'attention'],
  ['guest-moment', 'women enjoying in ML.jpg', 'attention'],
]

const widths = [480, 768, 1200, 1800]

async function buildImage(slug, fileName, position) {
  const source = path.join(sourceImages, fileName)
  for (const width of widths) {
    const pipeline = sharp(source)
      .rotate()
      .resize({ width, withoutEnlargement: true, fit: 'inside', position })
      .modulate({ saturation: 1.03, brightness: 1.01 })
      .sharpen({ sigma: 0.65 })

    await Promise.all([
      pipeline.clone().webp({ quality: width >= 1200 ? 78 : 76, effort: 5 }).toFile(path.join(imageOutput, `${slug}-${width}.webp`)),
      pipeline.clone().jpeg({ quality: width >= 1200 ? 80 : 78, mozjpeg: true }).toFile(path.join(imageOutput, `${slug}-${width}.jpg`)),
    ])
  }
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const process = spawn(ffmpegPath, args, { stdio: 'inherit' })
    process.on('error', reject)
    process.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`ffmpeg exited with code ${code}`))
    })
  })
}

async function buildVideo() {
  const cleanCinematicFrame = 'crop=3840:1632:0:264'
  const sharedVideoArgs = [
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-profile:v', 'high',
    '-level', '4.1',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
  ]

  await runFfmpeg([
    '-y', '-ss', '0', '-t', '18', '-i', sourceVideo,
    '-an',
    '-vf', `${cleanCinematicFrame},scale=1280:-2:flags=lanczos`,
    ...sharedVideoArgs,
    '-crf', '24',
    '-maxrate', '2600k',
    '-bufsize', '5200k',
    path.join(videoOutput, 'home-intro-loop-720.mp4'),
  ])

  await runFfmpeg([
    '-y', '-ss', '0', '-t', '18', '-i', sourceVideo,
    '-an',
    '-vf', `${cleanCinematicFrame},scale=1920:-2:flags=lanczos`,
    ...sharedVideoArgs,
    '-crf', '23',
    '-maxrate', '4800k',
    '-bufsize', '9600k',
    path.join(videoOutput, 'home-intro-loop-1080.mp4'),
  ])

  await buildMobileVideo(sharedVideoArgs)

  await runFfmpeg([
    '-y', '-i', sourceVideo,
    '-vf', `${cleanCinematicFrame},scale=1920:-2:flags=lanczos`,
    ...sharedVideoArgs,
    '-crf', '23',
    '-maxrate', '5200k',
    '-bufsize', '10400k',
    '-c:a', 'aac',
    '-b:a', '160k',
    path.join(videoOutput, 'magic-land-full-trailer.mp4'),
  ])

  await runFfmpeg([
    '-y', '-ss', '3', '-i', sourceVideo,
    '-frames:v', '1',
    '-vf', `${cleanCinematicFrame},scale=1920:-2:flags=lanczos`,
    '-q:v', '3',
    '-update', '1',
    path.join(videoOutput, 'home-intro-poster.jpg'),
  ])

  await sharp(path.join(videoOutput, 'home-intro-poster.jpg'))
    .webp({ quality: 80, effort: 5 })
    .toFile(path.join(videoOutput, 'home-intro-poster.webp'))
}

async function buildMobileVideo(sharedVideoArgs) {
  const mobileFrame = 'crop=918:1632:1040:264'

  await runFfmpeg([
    '-y', '-ss', '0', '-t', '18', '-i', sourceVideo,
    '-an',
    '-vf', `${mobileFrame},scale=720:1280:flags=lanczos`,
    ...sharedVideoArgs,
    '-crf', '24',
    '-maxrate', '2400k',
    '-bufsize', '4800k',
    path.join(videoOutput, 'home-intro-loop-mobile.mp4'),
  ])

  await runFfmpeg([
    '-y', '-ss', '3', '-i', sourceVideo,
    '-frames:v', '1',
    '-vf', `${mobileFrame},scale=720:1280:flags=lanczos`,
    '-q:v', '3',
    '-update', '1',
    path.join(videoOutput, 'home-intro-poster-mobile.jpg'),
  ])

  await sharp(path.join(videoOutput, 'home-intro-poster-mobile.jpg'))
    .webp({ quality: 80, effort: 5 })
    .toFile(path.join(videoOutput, 'home-intro-poster-mobile.webp'))
}

const videoOnly = process.argv.includes('--video-only')
const mobileOnly = process.argv.includes('--mobile-only')
const imagesOnly = process.argv.includes('--images-only')

if (!videoOnly && !mobileOnly) {
  if (!imagesOnly) {
    await rm(outputRoot, { recursive: true, force: true })
  }
  await mkdir(imageOutput, { recursive: true })
  console.log(`Processing ${photos.length} Magic Land photographs...`)
  for (const photo of photos) {
    console.log(`  ${photo[0]}`)
    await buildImage(...photo)
  }
}

if (!imagesOnly) {
  await mkdir(videoOutput, { recursive: true })
  console.log(`Encoding Magic Land ${mobileOnly ? 'mobile' : 'homepage'} video...`)
  if (mobileOnly) {
    const sharedVideoArgs = [
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-profile:v', 'high',
      '-level', '4.1',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
    ]
    await buildMobileVideo(sharedVideoArgs)
  } else {
    await buildVideo()
  }
}
console.log(`Media ready at ${outputRoot}`)
