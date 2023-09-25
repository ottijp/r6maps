# r6maps

[![Build Status](https://github.com/ottijp/r6maps/actions/workflows/deploy.yml/badge.svg)](https://github.com/ottijp/r6maps/actions/workflows/deploy.yml)

**Newest version now auto-hosted at https://ottijp.github.io/r6maps**

r6maps is designed to be a quick reference for Rainbow Six Siege maps.  Please see the about.html page for more details.

## Running locally

### Dependencies
- [npm/Nodejs](https://www.npmjs.com/get-npm)
- [Ruby](https://www.ruby-lang.org/en/)
    + [gem](https://rubygems.org/pages/download)
    + sass (`gem install sass`)

To check the dependencies, just type `scss`. If the program waits for input, your dependencies are installed correctly.

### Building and running
- Install npm and install packages: `npm install`
- General build: `npm run build`
    + Builds js and scss into the `site` folder.
    + To deploy, serve `site` as root directory.
- Developing: `npm run dev`
    + Watch and build automatically.
    + Start http server.

## Things to work on
Contributions are welcome. :)

### Active
Current development is fairly "steady state" with only a few new features planned:
- [ ] Menu footer links (twitter, email, donate?)
- [ ] Select map filter for casual, rank, custom, etc

### Steady-state
- [ ] Translations - [info on how you can help](https://purechaose.github.io/r6maps/about/translations-help.html).
- [ ] [Open issues](https://github.com/purechaose/r6maps/issues)
- [ ] Map accuracy - please log any errors/missing items as an [issue](https://github.com/purechaose/r6maps/issues)
- [ ] New maps

### Thinking about (maybe someday)...
- [ ] Mark breakable windows - [see original feature suggestion here](https://github.com/capajon/r6maps/issues/89).
- [ ] Better stats integration (e.g. link from objective) <- dependent on new data dumps from Ubisoft though
- [ ] Tactics drawing (& saving/sharing)
- [ ] Shared sessions (map controls, shared pings, drawing if available)
- [ ] Automated tests (perceptual diff?)
- [ ] Offline mode (progressive web app? Cordova?)
- [ ] Embedded curated hints/strats (e.g. drone placement, angles)
