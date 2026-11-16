// Route HTML phục vụ trực tiếp phòng hờ CDN
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get(['/taixiu', '/taixiu.html'], (req, res) => {
  res.sendFile(path.join(publicDir, 'taixiu.html'));
});

app.get(['/xocdia', '/xocdia.html'], (req, res) => {
  res.sendFile(path.join(publicDir, 'xocdia.html'));
});

app.get(['/baucua', '/baucua.html'], (req, res) => {
  res.sendFile(path.join(publicDir, 'baucua.html'));
});

app.get(['/bacay', '/bacay.html'], (req, res) => {
  res.sendFile(path.join(publicDir, 'bacay.html'));
});
