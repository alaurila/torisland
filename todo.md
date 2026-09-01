# Tarinamaailman juoni- ja tehtävägeneraattori – TODO

1. Projektin aloitus

1.1 [x] Luo vanilla JavaScript -projektin perusrakenne (`index.html`, `styles.css` ja JavaScript-moduulit).

1.2 [x] Lisää sovelluksen käynnistysohjeet README-tiedostoon.

1.3 [x] Määritä moduulit maailman simulaatiolle, tarinamoottorille, tekstigeneraattorille, käyttöliittymälle ja tallennukselle.

1.4 [x] Lisää projektille sopiva `.gitignore`.

2. Maailman tietorakenne

2.1 [x] Määritä serialisoitava `worldState`-objekti.

2.2 [x] Lisää `worldStateen` päivä, hahmot, lokaatiot, ryhmät, suhteet, muistot, tiedot, tapahtumat, aktiiviset tilanteet ja suoritetut tehtävät.

2.3 [x] Määritä hahmon tietomalli: tunniste, nimi, rooli, sijainti, ryhmäjäsenyydet, kolme ominaisuutta ja yksi tavoite.

2.4 [x] Määritä lokaation ja ryhmän tietomallit.

2.5 [x] Määritä tarpeiden, resurssien, salaisuuksien ja velkojen tietomallit.

2.6 [x] Lisää tietomallien validointi ja yksilöllisten tunnisteiden luonti.

3. Pienen maailman generointi

3.1 [x] Generoi ensimmäiseen versioon 6 hahmoa, 3 lokaatiota ja 2 ryhmää.

3.2 [x] Arvo hahmoille roolit, ominaisuudet, tavoitteet ja sijainnit.

3.3 [x] Liitä osa hahmoista ryhmiin ja lokaatioihin.

3.4 [x] Varmista, että generoitu maailma on yhdellä silmäyksellä ymmärrettävä.

3.5 [x] Valmistele generaattori laajennettavaksi 10 hahmoon, 5 lokaatioon ja 3 ryhmään.

4. Suhteet ja yhteinen historia

4.1 [x] Toteuta suhteet asteikolla `-100...+100`.

4.2 [x] Tue yhteyksiä hahmojen, ryhmien ja lokaatioiden välillä.

4.3 [x] Tallenna jokaiselle merkitykselliselle suhteelle arvo ja selitys.

4.4 [x] Generoi maailmaa edeltäviä tapahtumia, jotka selittävät suhteet, velat, vihollisuudet ja salaisuudet.

4.5 [x] Toteuta suhdearvon lukeminen ja muuttaminen rajatulla asteikolla.

4.6 [x] Jätä tietomalliin laajennusvara moniulotteisille suhteille, kuten luottamukselle, pelolle, kunnioitukselle ja velalle.

5. Alkutilanteen konfliktit

5.1 [x] Luo maailmaan vähintään yksi maksamaton velka tai toteutumaton lupaus.

5.2 [x] Luo vähintään yksi kadonnut resurssi, salainen rikos tai resurssipula.

5.3 [x] Luo ryhmien tai hahmojen välille ristiriitaisia tavoitteita.

5.4 [x] Varmista, että jokaisella konfliktilla on osapuolet, syy, sijainti ja ratkaisematon tila.

5.5 [x] Tarkista generoinnin jälkeen, että maailmassa on riittävästi aineksia ensimmäisiin tapahtumiin.

6. Tapahtumajärjestelmä

6.1 [x] Määritä tapahtuman tietomalli: tunniste, tyyppi, toimija, kohde, lokaatio, todistajat ja päivä.

6.2 [x] Luo vähintään 10 tapahtumatemplatea, kuten riita, ryöstö, varkaus, avunpyyntö, uhkaus, petos ja sovintoyritys.

6.3 [x] Valitse tapahtumien osapuolet suhteiden, tavoitteiden, konfliktien ja sijaintien perusteella.

6.4 [x] Estä epäkelvot tapahtumat tarkistamalla templaten vaatimukset ennen generointia.

6.5 [x] Lisää generoitu tapahtuma maailman tapahtumahistoriaan.

7. Tapahtumien seuraukset, muistot ja tieto

7.1 [x] Toteuta tapahtumien vaikutukset hahmojen ja ryhmien suhteisiin.

7.2 [x] Luo tapahtumista hahmoille muistot, joissa säilyvät kohde, voimakkuus ja syy.

7.3 [x] Tallenna, ketkä tietävät tapahtumasta ja ketkä tietävät sen todistajista.

7.4 [x] Päivitä tapahtumien perusteella tavoitteiden etenemistä, resursseja ja lokaatioiden tilaa.

7.5 [x] Päivitä aktiivisia konflikteja ja luo tarvittaessa uusia konflikteja.

7.6 [x] Varmista, että seuraukset vaikuttavat myöhempien tapahtumien ja tehtävien todennäköisyyksiin.

8. Jännitteiden ja tilanteiden tunnistaminen

8.1 [ ] Laske tilanteille jännitearvo vihamielisyydestä, ristiriitaisista tavoitteista, salaisuuksista, veloista, niukkuudesta ja läheisyydestä.

8.2 [ ] Tunnista voimakkaat vihollisuudet, maksamattomat velat, uhkatut hahmot ja samassa paikassa olevat viholliset.

8.3 [ ] Tunnista salaisuudet, todistajat, resurssipulat ja ratkaisemattomat aiemmat tapahtumat.

8.4 [ ] Muodosta löydöksistä aktiivisia tarinatilanteita ennen tehtävien luomista.

8.5 [ ] Järjestä tilanteet jännitearvon mukaan ja valitse kiinnostavimmat käsiteltäviksi.

8.6 [ ] Tallenna jokaiselle tilanteelle perustelut, joista näkyy miksi se generoitiin.

9. Tehtävien muodostaminen

9.1 [ ] Määritä tehtävätemplaten tyyppi, vaatimukset, osallistujat ja tekstipohja.

9.2 [ ] Luo vähintään 10 tehtävätemplatea.

9.3 [ ] Muunna havaittu tilanne pelaajalle esitettäväksi tehtäväksi.

9.4 [ ] Tarjoa yhdestä tilanteesta useita toimintatapoja, kuten auttaminen, sovittelu, resurssin hankinta, salaisuuden paljastaminen tai rikoksen peittäminen.

9.5 [ ] Toteuta paikkamerkkien, kuten `{giver}` ja `{target}`, täyttäminen maailman tiedoilla.

9.6 [ ] Toteuta tehtävän ratkaisun vaikutukset tapahtumiin, muistoihin, suhteisiin ja konflikteihin.

9.7 [ ] Siirrä ratkaistu tehtävä aktiivisista tilanteista suoritettujen tehtävien historiaan.

10. Jatkuva maailman simulaatio

10.1 [ ] Toteuta päivän tai vuoron eteneminen.

10.2 [ ] Anna hahmojen yrittää edistää tavoitteitaan jokaisella kierroksella.

10.3 [ ] Suorita kierroksella ketju: tavoitteet → tapahtumat → seuraukset → tilanteet → tehtävät.

10.4 [ ] Huomioi pelaajan päätökset seuraavan maailman tilan muodostamisessa.

10.5 [ ] Vähennä puhdasta satunnaisuutta maailman historian karttuessa.

11. Tallennus

11.1 [ ] Tallenna koko `worldState` JSON-muodossa `localStorageen`.

11.2 [ ] Lataa tallennettu maailma sovelluksen käynnistyessä.

11.3 [ ] Lisää uuden maailman luonti ja tallennetun maailman nollaus.

11.4 [ ] Käsittele puuttuva tai virheellinen tallennus hallitusti.

11.5 [ ] Pidä tallennusrajapinta sellaisena, että `localStorage` voidaan myöhemmin vaihtaa IndexedDB:hen.

12. Käyttöliittymä

12.1 [ ] Toteuta World-näkymä, joka näyttää päivän ja maailman tärkeimmän nykytilan.

12.2 [ ] Toteuta Characters-näkymä, joka näyttää hahmot ja heidän tärkeimmät suhteensa.

12.3 [ ] Toteuta Story feed -näkymä tapahtumahistorialle.

12.4 [ ] Lisää painike uuden tilanteen generoimiseen.

12.5 [ ] Näytä generoitu tilanne, sen osapuolet ja mahdolliset tehtäväratkaisut.

12.6 [ ] Näytä kehitystilassa tilanteen generoinnin perustelut ja käytetyt suhdearvot.

12.7 [ ] Lisää käyttöliittymään päivän eteneminen sekä tallennuksen tila.

13. Testaus ja viimeistely

13.1 [ ] Testaa `worldState`-datan serialisointi ja palautus.

13.2 [ ] Testaa suhdearvojen rajat ja tapahtumien seuraukset.

13.3 [ ] Testaa, että tapahtumat täyttävät templatejensa vaatimukset.

13.4 [ ] Testaa jännitearvojen laskenta ja kiinnostavimman tilanteen valinta.

13.5 [ ] Testaa tehtävien muodostaminen ja ratkaisujen vaikutukset maailmaan.

13.6 [ ] Tarkista, että sama maailma tuottaa loogisesti jatkuvan tapahtumaketjun usean päivän ajan.

13.7 [ ] Dokumentoi tunnetut rajoitukset ja seuraavan version kehitysideat.
