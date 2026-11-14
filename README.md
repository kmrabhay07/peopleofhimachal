# People of Himachal · Dharamshala

A little 3D walk through a fictionalized Dharamshala, inspired by the public experience of [People of Bengaluru](https://peopleofbengaluru.com/) and informed by [Vishal Vana's reference mirror](https://github.com/vishalvana/people-of-bengaluru-clone). The town, characters, and interface are original to this project.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Open the address printed by Vite. Enter Dharamshala, then use WASD, arrow keys, or the on-screen direction buttons. Select a character to open their profile or use **Find someone** to search by name, craft, or neighborhood. The neighborhood menu jumps between McLeod Ganj, Dharamkot, and Sidhpur.

## Content

The walk is a stylized interpretation of the neighborhoods. The six sample profiles are fictional. Edit the district and profile data in `src/people.js`. The site has no accounts or shared profile database.

## Build

Run `npm run build` and serve the contents of `dist/` with a static web host. Run `npm run preview` to preview that build locally.
