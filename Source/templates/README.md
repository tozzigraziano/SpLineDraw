# Template di Esportazione Robot

Questa cartella contiene i template per l'esportazione del codice robot da SpLineGenerator.

## Come Funziona

### Modalità Server Web
Se esegui l'applicazione tramite un server web (http://), i template vengono caricati da questi file esterni e sono completamente modificabili.

### Modalità File Locale
Se apri index.html direttamente dal file system (file://), vengono utilizzati template incorporati nel JavaScript per evitare problemi CORS.

## File Template KUKA

### kuka_template.dat
Template per il file di dati KUKA (.dat)

**Variabili disponibili:**
- `{{PROJECT_NAME}}` - Nome del progetto
- `{{NUM_POINTS}}` - Numero di punti nella spline
- `{{FRAME_POSITIONS}}` - Posizioni FRAME generate automaticamente
- `{{MOVE_POSITIONS}}` - Posizioni E6POS (inizializzate a zero)

### kuka_template.src
Template per il file sorgente KUKA (.src)

**Variabili disponibili:**
- `{{PROJECT_NAME}}` - Nome del progetto
- `{{NUM_POINTS}}` - Numero di punti nella spline
- `{{SPLINE_POINTS}}` - Punti spline con velocità generate automaticamente

## Come Modificare i Template

### Per modifiche temporanee (funziona sempre):
1. Modifica i template incorporati nel file `script.js`
2. Cerca la funzione `getEmbeddedKukaTemplates()`
3. Modifica i template `dat` e `src` all'interno

### Per modifiche permanenti (richiede server web):
1. Avvia un server web locale: `python -m http.server 8000`
2. Apri l'applicazione via http://localhost:8000
3. Modifica i file `.dat` e `.src` in questa cartella
4. **NON modificare** le variabili `{{VARIABILE}}` - vengono sostituite automaticamente
5. Salva i file e ricarica l'applicazione

## Esempi di Personalizzazione

### Modificare il percorso DISKPATH
Nel file `kuka_template.dat`:
```krl
&PARAM DISKPATH = KRC:\MioPercorso\Programs
```

### Aggiungere commenti personalizzati
```krl
; Template personalizzato per la mia azienda
; Creato da: Nome Programmatore
```

### Modificare parametri di velocità
Nel file `kuka_template.src`:
```krl
$VEL = {CP {{VELOCITY}},ORI1 90.0000,ORI2 90.0000}
```

## Risoluzione Problemi

- **Template non caricati**: L'applicazione usa automaticamente template incorporati
- **Errori CORS**: Usa un server web locale invece di aprire file:// direttamente
- **Modifiche non applicate**: Verifica di essere in modalità server web