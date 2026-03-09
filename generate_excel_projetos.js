const { Pool } = require('pg');
const XLSX = require('xlsx');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function generateExcel() {
  const query = `
    SELECT 
      p.nome as "Projeto", 
      pb.base_name as "Base",
      pb.base_code as "Código",
      CASE WHEN pb.is_active THEN 'Sim' ELSE 'Não' END as "Ativo"
    FROM projetos p 
    INNER JOIN project_bases pb ON pb.project_id = p.id 
    WHERE pb.is_active = true
    ORDER BY p.nome, pb.base_name;
  `;
  
  const result = await pool.query(query);
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Create worksheet from data
  const ws = XLSX.utils.json_to_sheet(result.rows);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 20 },
    { wch: 45 },
    { wch: 20 },
    { wch: 10 }
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Projetos x Bases');
  
  // Write file
  const filename = 'public/projetos_bases.xlsx';
  XLSX.writeFile(wb, filename);
  
  console.log('Arquivo gerado:', filename);
  console.log('Total de registros:', result.rows.length);
  
  await pool.end();
}

generateExcel().catch(console.error);
