# Tarinamaailma

Vanilla JavaScriptillä toteutettava juoni- ja tehtävägeneraattori. Sovellus simuloi
pientä maailmaa, jonka hahmojen tavoitteet, suhteet, muistot ja tapahtumat
synnyttävät uusia tarinatilanteita.

## Käynnistäminen

Sovellus käyttää JavaScript-moduuleja, joten se kannattaa avata paikallisen
HTTP-palvelimen kautta.

Jos koneella on Node.js, käynnistä projektihakemistossa:

```powershell
npx serve .
```

Avaa sen jälkeen komennon ilmoittama paikallinen osoite selaimessa.

Vaihtoehtoisesti voit käyttää esimerkiksi VS Code Live Server -laajennusta tai
Pythonin paikallista palvelinta:

```powershell
python -m http.server 8000
```

Python-palvelinta käytettäessä sovellus löytyy osoitteesta
<http://localhost:8000>.

## Projektirakenne

```text
index.html                 Sovelluksen HTML-runko
styles.css                 Ulkoasu ja responsiivisuus
js/app.js                  Sovelluksen käynnistys ja moduulien kokoaminen
js/world-state.js          Serialisoitava maailmantila ja tietomallien tehtaat
js/validation.js           Tietomallien validointi ja tunnisteiden luonti
js/world-generator.js      Pienen maailman konfiguroitava generointi
js/relations.js            Suhteiden luonti, lukeminen ja muuttaminen
js/conflicts.js            Konfliktimalli ja alkumaailman tarkistus
js/events.js               Tapahtumamalli, templatet ja tapahtumageneraattori
js/consequences.js         Tapahtumien seuraukset, muistot ja tieto
js/story-engine.js         Jännitteiden laskenta ja tilanteiden tunnistaminen
js/quest-engine.js         Tehtävätemplatet, muodostaminen ja ratkaiseminen
js/professions/            Ammattien äitiluokka, aliluokat ja katalogi
js/world-simulation.js     Maailman eteneminen ja tapahtumien seuraukset
js/story-engine.js         Jännitteiden ja tarinatilanteiden tunnistaminen
js/text-generator.js       Rakenteisen datan esittäminen tekstinä
js/storage.js              Maailman tallennus ja lataus
js/ui.js                   DOM-päivitykset ja käyttöliittymän tapahtumat
```

Toteutuksen eteneminen on kuvattu tiedostossa `todo.md` ja alkuperäinen idea
tiedostossa `tarinamaailman_juonigeneraattori.md`.
