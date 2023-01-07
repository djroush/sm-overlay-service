# sm-overlay-service
This project is a serverless web service used to create overlays for Super Metroid races

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Overlay web service ###

The easiest way to generate a URL to call this webservice is to use the [SM Overlay UI](https://djroush.github.io/sm-overlay/).  Configure it to your liking and click on the 'Copy Link' button

`GET /api/overlay/{THEME}`

#### Request path parameters ####

| Path parameters | Default value   | Values                                                     |
|-----------------|-----------------|------------------------------------------------------------|
|  THEME          |     N/A         | CERES, CRATERIA, BRINSTAR, SHIP, MARIDIA, NORFAIR, TOURIAN |

#### Query string parameters ####

| Query parameter      | Default value | Values                                                   | Notes
| -------------------- | ------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| hideAvatar           | false         | true, false                                              | When true, avatars will not be drawn on the overlay                   |
| hideTracker          | false         | true, false                                              | When true, trackers will not be drawn on the overlay                  |
| hideWins             | false         | true, false                                              | When true, wins will not be drawn on the overlay                      |
| hidePlayers          | false         | true, false                                              | When true, player names will not be drawn on the overlay              |
| leftAlignPlayers     | false         | true, false                                              | When true player names are left aligned, when false they are centered |
| player1              |               | Url encoded text, 1-16 characters                        | Can be omitted if hidePlayers=true                                    |
| player2              |               | Url encoded text, 1-16 characters                        | Can be omitted if hidePlayers=true                                    |
| hideLogo             | false         | true, false                                              | When true, the logo will not be drawn on the overlay                  |
| logoY                | 80            | [0-640] (integer)                                        | Parameter is optional, used to change the y position of the logo      |
| logo                 |               | DEFAULT, CHOOZO                                          | Can be omitted if hideLogo=true                                       |
| hideSettings         | false         | true, false                                              | When true, the settings will not be drawn on the overlay              |
| settingsY            | 165           | [0-530] (integer)                                        | Parameter is optional, used to change the y position of the settings  |
| mode                 |               | FULL, FULL_COUNTDOWN, MAJOR_MINOR, CHOZO                 | Can be omitted if hideSettings=true                                   |
| area                 |               | VANILLA, LIGHT, FULL                                     | Can be omitted if hideSettings=true                                   |
| difficulty           |               | BASIC, EASY, MEDIUM, HARD, HARDEST                       | Can be omitted if hideSettings=true                                   |
| start                |               | VANILLA, SHALLOW, MIDWAY, DEEP, RANDOM                   | Can be omitted if hideSettings=true                                   |
| morph                |               | EARLY, LATE, RANDOM                                      | Can be omitted if hideSettings=true                                   |
| bosses               |               | VANILLA, RANDOM                                          | Can be omitted if hideSettings=true                                   |
| escape               |               | VANILLA, RANDOM                                          | Can be omitted if hideSettings=true                                   |
