# Das Zürcher Parzival-Skriptorium

## [Web publication](https://dhbern.github.io/parzival-skriptorium-zh)

## Origin

* (TBD)

*Archival version (as-is): Data Science Lab, pdaengeli, 2024-11-04*

*UI improvements, migration to IIIF: Parzival team, domsteinbach, 2026-08-14,* https://github.com/DHBern/parzival-skriptorium-zh/pull/2

## License

---

<details><summary>Clean-up (before initial commit)</summary>

<br/>

General approach: remove all spurious files (copies, obsolete notes, process artefacts), primarily based on file names (visual check).

PWD: root directory of this repository

* purge OS junk and ftp log files:
  * `find . -type f -name "Thumbs.db" -delete`
  * `find . -type f -name \.DS_Store -delete`

* (re)moved:
  * `eklog` (php-based counter; log span: 2024-06-21 10:20:56 to 2024-11-03 21:08:52; count: 92)
  * `FrgZh/eklog` (php-based counter; log span: 2024-06-21 10:20:56 to 2024-07-19 14:37:08; count: 28)
  * `ONB_Cod2708/eklog` (php-based counter; log span: 2024-06-21 10:20:56 to 2024-07-26 15:29:24; count: 37)
  * `zOrdnerzusammenlegungZwischen` with sub dirs `Frgzh` and `ONB` (redundant)

</details>
