import { Router, Response } from "express";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth";
import {
  getReferences,
  getReferenceById,
  createReference,
  updateReference,
  deleteReference,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllUsers,
  getAdminStats,
  createCountryRuling,
  getCountryRulings,
} from "../storage";

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// ─── Stats ───────────────────────────────────────────────────────────────────

router.get("/stats", async (_req: AuthRequest, res: Response) => {
  try {
    const stats = await getAdminStats();
    res.json(stats);
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Users ───────────────────────────────────────────────────────────────────

router.get("/users", async (_req: AuthRequest, res: Response) => {
  try {
    const userList = await getAllUsers();
    const usersPublic = userList.map(({ passwordHash, ...u }) => u);
    res.json(usersPublic);
  } catch (error) {
    console.error("Admin users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── References CRUD ─────────────────────────────────────────────────────────

router.get("/references", async (req: AuthRequest, res: Response) => {
  try {
    const { madhab, country, categoryId, sourceType, search } = req.query;
    const refs = await getReferences({
      madhab: madhab as string,
      country: country as string,
      categoryId: categoryId as string,
      sourceType: sourceType as string,
      search: search as string,
      activeOnly: false, // admin sees all
    });
    res.json(refs);
  } catch (error) {
    console.error("Admin references error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/references/:id", async (req: AuthRequest, res: Response) => {
  try {
    const ref = await getReferenceById(req.params.id);
    if (!ref) {
      res.status(404).json({ error: "Reference not found" });
      return;
    }
    res.json(ref);
  } catch (error) {
    console.error("Admin get reference error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/references", async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      titleAr,
      content,
      contentAr,
      source,
      sourceType,
      madhab,
      country,
      categoryId,
      tags,
    } = req.body;

    if (!title || !content || !source || !sourceType) {
      res
        .status(400)
        .json({ error: "title, content, source, and sourceType are required" });
      return;
    }

    const ref = await createReference({
      title,
      titleAr,
      content,
      contentAr,
      source,
      sourceType,
      madhab,
      country,
      categoryId,
      tags,
    });
    res.status(201).json(ref);
  } catch (error) {
    console.error("Admin create reference error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/references/:id", async (req: AuthRequest, res: Response) => {
  try {
    const existing = await getReferenceById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: "Reference not found" });
      return;
    }

    const ref = await updateReference(req.params.id, req.body);
    res.json(ref);
  } catch (error) {
    console.error("Admin update reference error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/references/:id", async (req: AuthRequest, res: Response) => {
  try {
    const existing = await getReferenceById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: "Reference not found" });
      return;
    }

    await deleteReference(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error("Admin delete reference error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Categories CRUD ─────────────────────────────────────────────────────────

router.get("/categories", async (_req: AuthRequest, res: Response) => {
  try {
    const cats = await getAllCategories();
    res.json(cats);
  } catch (error) {
    console.error("Admin categories error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/categories", async (req: AuthRequest, res: Response) => {
  try {
    const { name, nameAr, parentId } = req.body;
    if (!name) {
      res.status(400).json({ error: "name is required" });
      return;
    }

    const cat = await createCategory({ name, nameAr, parentId });
    res.status(201).json(cat);
  } catch (error) {
    console.error("Admin create category error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/categories/:id", async (req: AuthRequest, res: Response) => {
  try {
    const cat = await updateCategory(req.params.id, req.body);
    res.json(cat);
  } catch (error) {
    console.error("Admin update category error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/categories/:id", async (req: AuthRequest, res: Response) => {
  try {
    await deleteCategory(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error("Admin delete category error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Country Rulings ─────────────────────────────────────────────────────────

router.get(
  "/country-rulings/:country",
  async (req: AuthRequest, res: Response) => {
    try {
      const rulings = await getCountryRulings(req.params.country);
      res.json(rulings);
    } catch (error) {
      console.error("Admin country rulings error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.post("/country-rulings", async (req: AuthRequest, res: Response) => {
  try {
    const { country, referenceId, notes } = req.body;
    if (!country || !referenceId) {
      res.status(400).json({ error: "country and referenceId are required" });
      return;
    }

    const ruling = await createCountryRuling({ country, referenceId, notes });
    res.status(201).json(ruling);
  } catch (error) {
    console.error("Admin create country ruling error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
