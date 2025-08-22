### Engine

### Download Logos

```
bun tasks/download-teller.ts
```

### Sync CDN

```
rclone copy logos r2demo:engine-assets -v --progress
```

### Import Institutions

```
bun tasks/import.ts
```
