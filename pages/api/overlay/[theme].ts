import type { NextApiRequest, NextApiResponse } from 'next'
import { areaValues, avatarValues, bossesValues, difficultyValues, escapeValues, logoValues, modeValues, morphValues, startValues, themeValues } from '../../../src/models/SliderValues';
import path from 'path'
import sharp from 'sharp'
import { PlayersState } from '../../../src/models/PlayersState';
import { OptionsState } from '../../../src/models/OptionsState';
import NextCors from 'nextjs-cors';
import 'typeface-roboto'

type OverlayErrorResponse = {
  errors: string[]
}

type OverlaySettings = {
  theme: string,
  logo: string,
  avatars: string,
  mode: string,
  area: string,
  difficulty: string,
  start: string,
  morph: string,
  bosses: string,
  escape: string
}

const getServerAssetPath = () => {
  return path.join(process.cwd(), 'public');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OverlayErrorResponse | any>,
) {

  //Apply CORS headers to the resposne
  await NextCors(req, res, {
    methods: ['GET'],
    origin: '*',
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  });

  if (req.method === 'GET') {
    const {
      theme, logo, avatars, mode, area, difficulty, start, morph, bosses, escape, //settings
      player1, player2,                                                           //players
      hidePlayers, hideLogo, hideSettings, hideTracker, hideAvatar, hideWins,     //options
      leftAlignPlayers, logoY, settingsY
    } = req.query ?? {}

    const settings: OverlaySettings = {
      theme: upper(theme, 'CERES'),
      logo: upper(logo, 'DEFAULT'),
      avatars: upper(avatars, 'DEFAULT'),
      mode: upper(mode, 'FULL'),
      area: upper(area, 'VANILLA'),
      difficulty: upper(difficulty, 'BASIC'),
      start: upper(start, 'VANILLA'),
      morph: upper(morph, 'EARLY'),
      bosses: upper(bosses, 'VANILLA'),
      escape: upper(escape, 'VANILLA')
    }
    const players: PlayersState = {
      player1: normalize(player1, ''),
      player2: normalize(player2, '')
    }
    const options: OptionsState = {
      hidePlayers: lower(hidePlayers, false),
      hideLogo: lower(hideLogo, false),
      hideSettings: lower(hideSettings, false),
      hideTracker: lower(hideTracker, false),
      hideAvatar: lower(hideAvatar, false),
      hideWins: lower(hideWins, false),
      leftAlignPlayers: lower(leftAlignPlayers, false),
      logoY: toNumber(logoY, 80),
      settingsY: toNumber(settingsY, 165),
    }

    const errors = validate(settings, players, options)
    if (errors.length > 0) {
      res
        .status(400)
        .json({ errors })
    } else {
      const overlay = await generateOverlay(settings, players, options)
      res
        .setHeader('Content-Disposition', 'attachment; filename="sm-overlay.png"')
        .status(200)
        .send(overlay)
    }
  } else {
    res
      .setHeader('Allow', 'GET')
      .status(405)
      .json({ errors: ['Expected to receive a GET request'] });
  }}

async function generateOverlay(settings: OverlaySettings, players: PlayersState, options: OptionsState): Promise<Buffer> {
  const { theme, logo, avatars } = settings
  const { hidePlayers, hideLogo, hideSettings, hideTracker, hideAvatar, hideWins, leftAlignPlayers, logoY,settingsY } = options
  const { player1, player2 } = players

  const serverAssetPath = getServerAssetPath();
  const themeLayer = sharp(`${serverAssetPath}/overlays/${theme.toLowerCase()}.png`)

  const backgroundLayer = await extractLayer(themeLayer, 0, 0, 1280, 720);
  const streamLayer = await extractLayer(themeLayer, 0, 720, 512, 390).toBuffer();
  const nameLayer = await extractLayer(themeLayer, 512, 720, 341, 107).toBuffer();
  const timerLayer = await extractLayer(themeLayer, 853, 720, 151, 107).toBuffer();
  const trackerLayer = await extractLayer(themeLayer, 512, 827, 210, 204).toBuffer();
  const avatarLayer = await extractLayer(themeLayer, 722, 827, 162, 195).toBuffer();
  const winsLayer = await extractLayer(themeLayer, 884, 827, 97, 195).toBuffer();
  const p1AvatarLayer = await extractLayer(themeLayer, 1004, 720, 162, 195).toBuffer();
  const p2AvatarLayer = await extractLayer(themeLayer, 1004, 915, 162, 195).toBuffer();

  let overlayLayers = [
    { input: streamLayer, left: 15, top: 116 },
    { input: streamLayer, left: 751, top: 116 },
    { input: nameLayer, left: 15, top: 25 },
    { input: nameLayer, left: 751, top: 25 },
    { input: timerLayer, left: 377, top: 25 },
    { input: timerLayer, left: 1113, top: 25 }
  ]
  if (!hideTracker) {
    overlayLayers = overlayLayers.concat([
      { input: trackerLayer, left: 15, top: 491 },
      { input: trackerLayer, left: 1053, top: 491 },
    ])
  }
  if (!hideAvatar) {
    overlayLayers = overlayLayers.concat([
      { input: avatarLayer, left: 245, top: 491 },
      { input: avatarLayer, left: 867, top: 491 },
    ])
  }
  if (!hideWins) {
    overlayLayers = overlayLayers.concat([
      { input: winsLayer, left: 431, top: 491 },
      { input: winsLayer, left: 753, top: 491 }
    ])
  }
  if (!hideAvatar && avatars !== 'EMPTY' ) {
    overlayLayers = overlayLayers.concat([
      { input: p1AvatarLayer, left: 245, top: 491 },
      { input: p2AvatarLayer, left: 867, top: 491 },
    ])
  }

  if (!hidePlayers) {
    const player1Layer = await generatePlayer(player1, leftAlignPlayers)
    const player2Layer = await generatePlayer(player2, leftAlignPlayers)

    overlayLayers = overlayLayers.concat([
      { input: player1Layer, left: 30, top: 47 },
      { input: player2Layer, left: 766, top: 47 }
    ])
  }
  if (!hideLogo) {
    const logoLayer = await sharp(`${serverAssetPath}/logos/${logo.toLowerCase()}.png`).toBuffer()

    overlayLayers = overlayLayers.concat([
      { input: logoLayer, left: 530, top: logoY }
    ])
  }
  if (!hideSettings) {
    const settingsLayer = await generateSettings(settings)
    overlayLayers = overlayLayers.concat([
      { input: settingsLayer, left: 534, top: settingsY }
    ])
  }
  const overlay = backgroundLayer.composite(overlayLayers)
  return overlay.toBuffer()
}

const extractLayer = (image: sharp.Sharp, x: number, y: number, w: number, h: number) => {
  return image
    .clone()
    .extract({
      left: x,
      top: y,
      width: w,
      height: h
    })
}

const fontWeight = 600

const generatePlayer = (player: string, leftAlign: boolean) => {
  const xPos = leftAlign ? '10' : '50%'
  const anchorPos = leftAlign ? 'start' : 'middle'

  return Buffer.from(`
    <svg width="312" height="51">
        <text x="${xPos}" y="50%" text-anchor="${anchorPos}" font-weight="${fontWeight}" font-family="Roboto,sans-serif" font-size="29px" dx="-4" stroke="black" stroke-width="2">${player}</text>
        <text x="${xPos}" y="50%" text-anchor="${anchorPos}" font-weight="${fontWeight}" font-family="Roboto,sans-serif" font-size="29px" dx="-4" fill="#FDF3FB" >${player}</text>
    </svg>
`);
}

const generateSettings = (settings: OverlaySettings) => {
  const { mode, area, difficulty, start, morph, bosses, escape } = settings

  const settingsText = [
    `MODE - ${mode}`,
    `AREA - ${area}`,
    `DIFFICULTY - ${difficulty}`,
    `START - ${start}`,
    `MORPH - ${morph}`,
    `BOSSES - ${bosses}`,
    `ESCAPE - ${escape}`
  ]

  let svgText = '<svg width="220" height="184">\n'
  settingsText.forEach((setting, index) => {
    const height = 25 * (index + 1)
    svgText += `\t<text x="4" font-family="Roboto,sans-serif" font-weight="${fontWeight}" font-size="16px" stroke="black" stroke-width="2" dx="-4" dy="${height}">${setting}</text>\n`
    svgText += `\t<text x="4" font-family="Roboto,sans-serif" font-weight="${fontWeight}" font-size="16px" fill="#FDF3FB" dx="-4" dy="${height}">${setting}</text>\n`
  })
  svgText += '</svg>\n'
  return Buffer.from(svgText)
}

function validate(settings: OverlaySettings, players: PlayersState, options: OptionsState): string[] {
  const { theme, logo, avatars, mode, area, difficulty, start, morph, bosses, escape } = settings
  const { player1, player2 } = players
  const { hideLogo, hidePlayers, hideSettings, hideAvatar } = options

  const errors: string[] = []

  if (theme === undefined || !themeValues.includes(upper(theme))) {
    errors.push('theme is required, valid values are (' + themeValues.join(',') + ')');
  };
  if (!hideLogo) {
    if (logo !== undefined && !logoValues.includes(upper(logo))) {
      errors.push('logo is required unless hideLogo=true, valid values are (' + logoValues.join(',') + ')');
    }
  }
  if (!hideSettings) {
    if (mode === undefined || !modeValues.includes(upper(mode))) {
      const updatedModeValues = modeValues.map(a => a.replace(' ', '_'))
      errors.push('mode is required unless hideSettings=true, valid values are (' + updatedModeValues.join(',') + ')');
    }
    if (!('area' in settings) || !areaValues.includes(upper(area))) {
      errors.push('area is required unless hideSettings=true, valid values are (' + areaValues.join(',') + ')');
    }
    if (!('difficulty' in settings) || !difficultyValues.includes(upper(difficulty))) {
      errors.push('difficulty is required unless hideSettings=true, valid values are (' + difficultyValues.join(',') + ')');
    }
    if (!('start' in settings) || !startValues.includes(upper(start))) {
      errors.push('start is required unless hideSettings=true, valid values are (' + startValues.join(',') + ')');
    }
    if (!('morph' in settings) || !morphValues.includes(upper(morph))) {
      errors.push('morph is required unless hideSettings=true, valid values are (' + morphValues.join(',') + ')');
    }
    if (!('bosses' in settings) || !bossesValues.includes(upper(bosses))) {
      errors.push('bosses is required unless hideSettings=true, valid values are (' + bossesValues.join(',') + ')');
    }
    if (!('escape' in settings) || !escapeValues.includes(upper(escape))) {
      errors.push('escape is required unless hideSettings=true, valid values are (' + escapeValues.join(',') + ')');
    }
  }
  if (!hideAvatar) {
    if (!('avatars' in settings) || !avatarValues.includes(upper(avatars))) {
      errors.push('avatars is required unless hideAvatar=true, valid values are (' + avatarValues.join(',') + ')');
    }

  }
  if (!hidePlayers) {
    if (player1 !== undefined && player1?.trim().length === 0) {
      errors.push('player1 cannot be blank unless hidePlayers=true')
    }
    if (player2 !== undefined && player2?.trim().length === 0) {
      errors.push('player2 cannot be blank unless hidePlayers=true')
    }
  }

  return errors;
}

function lower(input: string | string[] | undefined, defaultValue?: boolean): boolean {
  if (input === undefined || input === null || input === '') {
    return defaultValue ?? false;
  } else if (Array.isArray(input)) {
    input = input[0]
  }
  return input?.toLowerCase() !== 'false';
}

function toNumber(input: string | string[] | undefined, defaultValue?: number): number {
  if (input === undefined || input === null || input === '') {
    return defaultValue ?? 0;
  } else if (Array.isArray(input)) {
    input = input[0]
  }
  return Number(input?.toLowerCase());
}


function normalize(input: string | string[] | undefined, defaultValue?: string): string {
  if (input === undefined || input === null || input === '') {
    return defaultValue ?? '';
  } else if (Array.isArray(input)) {
    input = input[0]
  }
  return input;
}


function upper(input: string | string[] | undefined, defaultValue?: string): string {
  if (input === undefined) {
    return defaultValue ?? '';
  } else if (Array.isArray(input)) {
    return input[0].toUpperCase();
  }
  return input.toUpperCase().replaceAll('_', ' ');
}
