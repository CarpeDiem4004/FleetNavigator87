import { db } from '../db';
import { sql } from 'drizzle-orm';
import { normalizeBaseName } from '../../shared/baseNormalization';

async function reNormalizeFuelCardBases() {
  console.log('🔄 Starting re-normalization of fuel card solicitations...');
  
  try {
    console.log('📋 Step 1: Creating backup table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS solicitacoes_fuel_card_backup_renormalize AS 
      SELECT * FROM solicitacoes_fuel_card
    `);
    console.log('✅ Backup created: solicitacoes_fuel_card_backup_renormalize');
    
    console.log('📊 Step 2: Fetching all unique base values...');
    const result = await db.execute(sql`
      SELECT DISTINCT base FROM solicitacoes_fuel_card WHERE base IS NOT NULL
    `);
    
    const bases = result.rows as Array<{ base: string }>;
    console.log(`Found ${bases.length} unique base values`);
    
    console.log('🔧 Step 3: Re-normalizing all bases...');
    let updatedCount = 0;
    
    for (const { base } of bases) {
      const normalizedBase = normalizeBaseName(base);
      
      if (base !== normalizedBase) {
        await db.execute(sql`
          UPDATE solicitacoes_fuel_card 
          SET base = ${normalizedBase}
          WHERE base = ${base}
        `);
        console.log(`  ✓ Updated: "${base}" → "${normalizedBase}"`);
        updatedCount++;
      }
    }
    
    console.log(`✅ Step 3 complete: ${updatedCount} bases re-normalized`);
    
    console.log('🔍 Step 4: Verifying alignment with project_bases...');
    const verifyResult = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT s.base) as total_solicitation_bases,
        COUNT(DISTINCT pb.base_name) as matching_project_bases
      FROM solicitacoes_fuel_card s
      LEFT JOIN project_bases pb ON s.base = pb.base_name
      WHERE s.base IS NOT NULL
    `);
    
    console.log('Verification result:', verifyResult.rows[0]);
    
    console.log('✅ Re-normalization complete!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

reNormalizeFuelCardBases()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
