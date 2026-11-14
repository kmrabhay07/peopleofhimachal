# People of Himachal · Dharamshala

A little 3D walk through a fictionalized Dharamshala, inspired by the public experience of [People of Bengaluru](https://peopleofbengaluru.com/) and informed by [Vishal Vana's reference mirror](https://github.com/vishalvana/people-of-bengaluru-clone). The town, characters, and interface are original to this project.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Open the address printed by Vite and select **Enter Dharamshala** to start outside HPCA Cricket Stadium. Walk straight ahead to reach the pitch. Use WASD, the arrow keys, or the on-screen direction buttons to move. Hold Shift to sprint and drag the scene to look around. Press E to interact with a nearby character or landmark, or F to search profiles.

Use **Landmarks** to travel to HPCA Cricket Stadium, Tsuglagkhang, St John in the Wilderness, Norbulingka Institute, and Bhagsunag Temple & Falls.

## Content

On the hosted site, select **Join live walk** to share your avatar's position with other visitors in the same neighborhood. Everyone joins as a guest. Select **Leave live walk** to stop sharing.

The walk is a stylized interpretation of the neighborhoods. The six sample profiles are fictional. Edit the district and profile data in `src/people.js`. The site has no accounts or shared profile database.

## Build

Run `npm run build` and serve the contents of `dist/` with a static web host. Run `npm run preview` to preview that build locally.
