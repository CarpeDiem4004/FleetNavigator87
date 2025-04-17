import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { insertBaseSchema } from '@shared/schema';

// Middleware para verificar autenticação em rotas protegidas
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Não autenticado" });
};

// Middleware para verificar se o usuário é admin
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: "Acesso negado. Permissão de administrador necessária." });
};

const router = (app: any) => {
  // Obter todas as bases
  app.get('/api/bases', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const bases = await storage.getAllBases();
      res.json(bases);
    } catch (error) {
      console.error('Erro ao obter bases:', error);
      res.status(500).json({ error: 'Erro ao obter bases' });
    }
  });

  // Obter uma base específica
  app.get('/api/bases/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const base = await storage.getBase(id);
      
      if (!base) {
        return res.status(404).json({ error: 'Base não encontrada' });
      }
      
      res.json(base);
    } catch (error) {
      console.error('Erro ao obter base:', error);
      res.status(500).json({ error: 'Erro ao obter base' });
    }
  });

  // Criar uma nova base
  app.post('/api/bases', isAdmin, async (req: Request, res: Response) => {
    try {
      const baseData = insertBaseSchema.parse(req.body);
      const newBase = await storage.createBase(baseData);
      res.status(201).json(newBase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Erro ao criar base:', error);
      res.status(500).json({ error: 'Erro ao criar base' });
    }
  });

  // Atualizar uma base existente
  app.patch('/api/bases/:id', isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const baseData = insertBaseSchema.partial().parse(req.body);
      
      const updatedBase = await storage.updateBase(id, baseData);
      
      if (!updatedBase) {
        return res.status(404).json({ error: 'Base não encontrada' });
      }
      
      res.json(updatedBase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Erro ao atualizar base:', error);
      res.status(500).json({ error: 'Erro ao atualizar base' });
    }
  });

  // Excluir uma base
  app.delete('/api/bases/:id', isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteBase(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Base não encontrada' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir base:', error);
      res.status(500).json({ error: 'Erro ao excluir base' });
    }
  });
};

export default router;