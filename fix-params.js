const fs = require('fs');

const files = [
  'views/veiculos/template/VeiculoDetalhePage.tsx',
  'views/veiculos/template/VeiculoEditarPage.tsx',
  'views/oficina/template/OficinaDetalhePage.tsx',
  'views/oficina/template/OficinaManutencaoDetalhe.tsx',
  'views/clientes/template/ClienteDetalhePage.tsx',
  'views/clientes/template/ClienteEditarPage.tsx',
  'views/alugueis/template/AluguelNovoPage.tsx',
  'views/alugueis/template/AluguelDetalhePage.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/const id = params\.id(?: as string)?;?/g, `const id = (typeof window !== 'undefined' && (!params.id || params.id === 'placeholder') ? window.location.pathname.split('/').filter(Boolean).pop() : params.id) as string;`);
  fs.writeFileSync(f, content);
  console.log('Fixed ' + f);
});
