import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

// Types
interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  OPENAI_API_KEY: string;
  GOOGLE_AI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  LIVEKIT_API_KEY: string;
  LIVEKIT_API_SECRET: string;
  LIVEKIT_WS_URL: string;
  STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_SECRET_KEY: string;
  MOCHA_USERS_SERVICE_API_KEY: string;
  MOCHA_USERS_SERVICE_API_URL: string;
  OPENROUTER_API_KEY: string;
}



// Validation schemas
const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  age: z.number().optional(),
  user_type: z.string().optional(),
});

const chatMessageSchema = z.object({
  content: z.string().min(1),
  conversation_id: z.number().optional(),
  analysis: z.object({
    score: z.number(),
    emotionalTone: z.string(),
    strategy: z.string()
  }).optional(),
  anamnesis_data: z.any().optional(),
});

const anamnesisSchema = z.object({
  responses: z.array(z.object({
    step: z.number(),
    question_index: z.number(),
    question: z.string(),
    response: z.string(),
  })),
});



// Initialize app
const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

// Health check
app.get("/", (c) => {
  return c.json({ 
    message: "Quero Conversar API is running",
    timestamp: new Date().toISOString()
  });
});

// Auth routes
app.post("/api/auth/register", zValidator("json", userSchema), async (c) => {
  const { email, name, age, user_type } = c.req.valid("json");
  
  try {
    // Check if user already exists
    const existingUser = await c.env.DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).bind(email).first();

    if (existingUser) {
      return c.json({ error: "User already exists" }, 400);
    }

    // Check for SUPERADMIN emails
    const superAdminEmails = ['gtosegbot@', 'admgtoseg@', 'disparoseguroback@gmail.com'];
    const isSuperAdmin = superAdminEmails.some(adminEmail => email.includes(adminEmail));
    
    let finalUserType = user_type || 'user';
    if (isSuperAdmin) {
      finalUserType = 'superadmin';
    }

    // Create user
    const result = await c.env.DB.prepare(
      "INSERT INTO users (email, name, age, user_type) VALUES (?, ?, ?, ?) RETURNING *"
    ).bind(email, name, age, finalUserType).first() as any;

    if (!result) {
      return c.json({ error: "Failed to create user" }, 500);
    }

    // Create superadmin record if needed
    if (isSuperAdmin) {
      await c.env.DB.prepare(
        "INSERT INTO super_admins (user_id, level, permissions) VALUES (?, 'super_admin', '{\"all\": true}')"
      ).bind(result.id).run();
    }

    // Initialize user stats (only for regular users) - always start from zero
    if (!isSuperAdmin) {
      await c.env.DB.prepare(
        "INSERT INTO user_stats (user_id, level, energy_points, daily_interactions, total_interactions, streak_days) VALUES (?, 1, 0, 0, 0, 0)"
      ).bind(result.id).run();

      // Generate daily tasks for new user
      await generateDailyTasks(c.env.DB, Number(result.id));
    }

    return c.json({ user: result });
  } catch (error) {
    console.error("Registration error:", error);
    return c.json({ error: "Registration failed" }, 500);
  }
});

app.post("/api/auth/login", zValidator("json", z.object({ email: z.string().email() })), async (c) => {
  const { email } = c.req.valid("json");
  
  try {
    // Check for SUPERADMIN emails first
    const superAdminEmails = ['gtosegbot@', 'admgtoseg@', 'disparoseguroback@gmail.com'];
    const isSuperAdmin = superAdminEmails.some(adminEmail => email.includes(adminEmail));
    
    const user = await c.env.DB.prepare(
      "SELECT * FROM users WHERE email = ?"
    ).bind(email).first() as any;

    if (!user) {
      // If superadmin email doesn't exist, auto-create
      if (isSuperAdmin) {
        const autoUser = await c.env.DB.prepare(
          "INSERT INTO users (email, name, user_type) VALUES (?, ?, 'superadmin') RETURNING *"
        ).bind(email, 'Super Admin', 'superadmin').first() as any;
        
        await c.env.DB.prepare(
          "INSERT INTO super_admins (user_id, level, permissions) VALUES (?, 'super_admin', '{\"all\": true}')"
        ).bind(autoUser.id).run();
        
        return c.json({ user: autoUser });
      }
      return c.json({ error: "User not found" }, 404);
    }

    // Update user type if it's a superadmin email but not properly set
    if (isSuperAdmin && user.user_type !== 'superadmin') {
      await c.env.DB.prepare(
        "UPDATE users SET user_type = 'superadmin' WHERE id = ?"
      ).bind(user.id).run();
      
      // Ensure superadmin record exists
      const existingSuperAdmin = await c.env.DB.prepare(
        "SELECT id FROM super_admins WHERE user_id = ?"
      ).bind(user.id).first();
      
      if (!existingSuperAdmin) {
        await c.env.DB.prepare(
          "INSERT INTO super_admins (user_id, level, permissions) VALUES (?, 'super_admin', '{\"all\": true}')"
        ).bind(user.id).run();
      }
      
      user.user_type = 'superadmin';
    }

    return c.json({ user });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "Login failed" }, 500);
  }
});

// Anamnesis routes
app.post("/api/anamnesis", zValidator("json", anamnesisSchema), async (c) => {
  const { responses } = c.req.valid("json");
  const userId = 1; // TODO: Get from auth

  try {
    const stmt = c.env.DB.prepare(
      "INSERT INTO anamnesis_responses (user_id, step_number, question_index, question, response) VALUES (?, ?, ?, ?, ?)"
    );

    for (const response of responses) {
      await stmt.bind(
        userId,
        response.step,
        response.question_index,
        response.question,
        response.response
      ).run();
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Anamnesis save error:", error);
    return c.json({ error: "Failed to save anamnesis" }, 500);
  }
});

// Mark anamnesis as completed
app.post("/api/user/anamnesis-complete", async (c) => {
  const { user_id } = await c.req.json();

  try {
    await c.env.DB.prepare(
      "INSERT OR REPLACE INTO user_anamnesis_status (user_id, is_completed, completed_at) VALUES (?, true, CURRENT_TIMESTAMP)"
    ).bind(user_id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error marking anamnesis as complete:", error);
    return c.json({ error: "Failed to mark anamnesis as complete" }, 500);
  }
});

// Check anamnesis status
app.get("/api/user/anamnesis-status/:userId", async (c) => {
  const userId = parseInt(c.req.param("userId"));

  try {
    const status = await c.env.DB.prepare(
      "SELECT is_completed, completed_at FROM user_anamnesis_status WHERE user_id = ?"
    ).bind(userId).first();

    return c.json({
      completed: status?.is_completed || false,
      completed_at: status?.completed_at
    });
  } catch (error) {
    console.error("Error checking anamnesis status:", error);
    return c.json({ error: "Failed to check anamnesis status" }, 500);
  }
});

// Get conversation messages
app.get("/api/conversations/:conversationId/messages", async (c) => {
  const conversationId = c.req.param("conversationId");

  try {
    const messages = await c.env.DB.prepare(
      "SELECT id, content, message_type, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC"
    ).bind(conversationId).all();

    return c.json({ messages: messages.results });
  } catch (error) {
    console.error("Get messages error:", error);
    return c.json({ error: "Failed to fetch messages" }, 500);
  }
});

// Chat routes
app.post("/api/chat", zValidator("json", chatMessageSchema), async (c) => {
  const { content, conversation_id, analysis } = c.req.valid("json");
  const userId = 1; // TODO: Get from auth

  try {
    // Get user stats for rate limiting
    const userStats = await c.env.DB.prepare(
      "SELECT * FROM user_stats WHERE user_id = ?"
    ).bind(userId).first() as any;

    const user = await c.env.DB.prepare(
      "SELECT plan FROM users WHERE id = ?"
    ).bind(userId).first() as any;

    // Check daily limits for free users
    if (user?.plan === 'free' && Number(userStats?.daily_interactions || 0) >= 15) {
      return c.json({ error: "Daily interaction limit reached" }, 429);
    }

    // Create or get conversation
    let convId = conversation_id;
    if (!convId) {
      const conv = await c.env.DB.prepare(
        "INSERT INTO conversations (user_id, title) VALUES (?, ?) RETURNING id"
      ).bind(userId, "Nova Conversa").first() as any;
      convId = Number(conv?.id);
    }

    // Save user message
    await c.env.DB.prepare(
      "INSERT INTO messages (conversation_id, user_id, content, message_type) VALUES (?, ?, ?, ?)"
    ).bind(convId, userId, content, 'user').run();

    // Get conversation context
    const previousMessages = await c.env.DB.prepare(
      "SELECT content, message_type FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 10"
    ).bind(convId).all();

    // Get user anamnesis for context
    const anamnesisData = await c.env.DB.prepare(
      "SELECT question, response FROM anamnesis_responses WHERE user_id = ? ORDER BY step_number, question_index"
    ).bind(userId).all();

    // Generate AI response with enhanced Dr. Clara
    const aiResponse = await generateAIResponse(c.env, content, previousMessages.results, anamnesisData.results, analysis);

    // Save AI response
    await c.env.DB.prepare(
      "INSERT INTO messages (conversation_id, user_id, content, message_type, ai_model) VALUES (?, ?, ?, ?, ?)"
    ).bind(convId, userId, aiResponse, 'bot', 'groq').run();

    // Update user stats
    await c.env.DB.prepare(
      "UPDATE user_stats SET daily_interactions = daily_interactions + 1, total_interactions = total_interactions + 1, last_activity_date = DATE('now') WHERE user_id = ?"
    ).bind(userId).run();

    return c.json({ 
      response: aiResponse, 
      conversation_id: convId 
    });

  } catch (error) {
    console.error("Chat error:", error);
    return c.json({ error: "Chat failed" }, 500);
  }
});

// Dashboard data
app.get("/api/dashboard/:userId", async (c) => {
  const userId = parseInt(c.req.param("userId"));

  try {
    // Generate daily tasks first if needed
    await generateDailyTasks(c.env.DB, userId);

    // Get user stats
    const userStats = await c.env.DB.prepare(
      "SELECT * FROM user_stats WHERE user_id = ?"
    ).bind(userId).first();

    // Get today's tasks
    const tasks = await c.env.DB.prepare(
      "SELECT * FROM daily_tasks WHERE user_id = ? AND task_date = DATE('now') ORDER BY created_at"
    ).bind(userId).all();

    // Get user plan
    const user = await c.env.DB.prepare(
      "SELECT plan FROM users WHERE id = ?"
    ).bind(userId).first();

    return c.json({
      user_stats: userStats,
      daily_tasks: tasks.results,
      plan: user?.plan || 'free'
    });

  } catch (error) {
    console.error("Dashboard data error:", error);
    return c.json({ error: "Failed to fetch dashboard data" }, 500);
  }
});

// Complete daily task
app.post("/api/tasks/:taskId/complete", async (c) => {
  const taskId = parseInt(c.req.param("taskId"));
  const userId = 1; // TODO: Get from auth

  try {
    // Complete task
    await c.env.DB.prepare(
      "UPDATE daily_tasks SET completed = TRUE WHERE id = ? AND user_id = ?"
    ).bind(taskId, userId).run();

    // Get task points
    const task = await c.env.DB.prepare(
      "SELECT points FROM daily_tasks WHERE id = ?"
    ).bind(taskId).first();

    // Update user stats
    await c.env.DB.prepare(
      "UPDATE user_stats SET energy_points = energy_points + ? WHERE user_id = ?"
    ).bind(task?.points || 0, userId).run();

    return c.json({ success: true, points: task?.points || 0 });

  } catch (error) {
    console.error("Task completion error:", error);
    return c.json({ error: "Failed to complete task" }, 500);
  }
});

// LiveKit and Payment routes
app.post("/api/appointments/:appointmentId/livekit-token", async (c) => {
  const appointmentId = c.req.param("appointmentId");
  const { userType } = await c.req.json();
  const userId = 1; // TODO: Get from auth

  try {
    // Verify appointment access
    const appointment = await c.env.DB.prepare(
      "SELECT * FROM appointments WHERE id = ? AND (user_id = ? OR professional_id IN (SELECT id FROM professionals WHERE user_id = ?))"
    ).bind(appointmentId, userId, userId).first();

    if (!appointment) {
      return c.json({ error: "Appointment not found" }, 404);
    }

    // Generate LiveKit token
    const token = await generateLiveKitToken(c.env, appointmentId, userId, userType);
    
    return c.json({
      token,
      wsUrl: c.env.LIVEKIT_WS_URL,
      roomName: `appointment_${appointmentId}`
    });

  } catch (error) {
    console.error("LiveKit token error:", error);
    return c.json({ error: "Failed to generate token" }, 500);
  }
});

// Document upload
app.post("/api/documents/upload", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file') as File;
  const appointmentId = formData.get('appointment_id') as string;
  const userId = parseInt(formData.get('user_id') as string) || 1;
  const professionalId = formData.get('professional_id') as string;
  const documentType = formData.get('document_type') as string || 'general';
  const description = formData.get('description') as string;

  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }

  try {
    // Generate unique key for R2
    const r2Key = `documents/${userId}/${Date.now()}_${file.name}`;

    // Upload to R2
    await c.env.R2_BUCKET.put(r2Key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
        contentDisposition: `attachment; filename="${file.name}"`,
      },
    });

    // Save to database
    const result = await c.env.DB.prepare(
      "INSERT INTO documents (user_id, professional_id, appointment_id, filename, original_filename, file_size, file_type, r2_key, document_type, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *"
    ).bind(
      userId,
      professionalId || null,
      appointmentId || null,
      r2Key,
      file.name,
      file.size,
      file.type,
      r2Key,
      documentType,
      description
    ).first();

    return c.json({ document: result });

  } catch (error) {
    console.error("Document upload error:", error);
    return c.json({ error: "Upload failed" }, 500);
  }
});

// Document download
app.get("/api/documents/:documentId/download", async (c) => {
  const documentId = c.req.param("documentId");
  const userId = 1; // TODO: Get from auth

  try {
    // Get document info
    const document = await c.env.DB.prepare(
      "SELECT * FROM documents WHERE id = ? AND (user_id = ? OR professional_id IN (SELECT id FROM professionals WHERE user_id = ?))"
    ).bind(documentId, userId, userId).first();

    if (!document) {
      return c.json({ error: "Document not found" }, 404);
    }

    // Get from R2
    const object = await c.env.R2_BUCKET.get(document.r2_key as string);
    if (!object) {
      return c.json({ error: "File not found in storage" }, 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);

    return c.body(object.body, { headers });

  } catch (error) {
    console.error("Document download error:", error);
    return c.json({ error: "Download failed" }, 500);
  }
});

// Professional registration
app.post("/api/register-professional", async (c) => {
  try {
    const formData = await c.req.formData();
    const userId = parseInt(formData.get('user_id') as string);
    const specialty = formData.get('specialty') as string;
    const bio = formData.get('bio') as string;
    const experienceYears = parseInt(formData.get('experience_years') as string) || 0;
    const location = formData.get('location') as string;
    const hourlyRate = parseFloat(formData.get('hourly_rate') as string) || 0;
    const languages = formData.get('languages') as string || 'Português';

    // Validate required fields
    if (!userId || !specialty || !bio || hourlyRate <= 0) {
      return c.json({ error: "Missing required fields: user_id, specialty, bio, hourly_rate are required" }, 400);
    }

    // Verify user exists
    const user = await c.env.DB.prepare(
      "SELECT id FROM users WHERE id = ?"
    ).bind(userId).first();

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Check if user already has a professional profile
    const existingProfessional = await c.env.DB.prepare(
      "SELECT id FROM professionals WHERE user_id = ?"
    ).bind(userId).first();

    if (existingProfessional) {
      return c.json({ error: "User already has a professional profile" }, 400);
    }

    // Create professional record
    const result = await c.env.DB.prepare(
      "INSERT INTO professionals (user_id, specialty, bio, experience_years, location, hourly_rate, languages, commission_rate, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, 0.80, false) RETURNING *"
    ).bind(userId, specialty, bio, experienceYears, location || '', hourlyRate, languages).first() as any;

    if (!result) {
      return c.json({ error: "Failed to create professional record" }, 500);
    }

    // Handle certificate uploads
    const certificateFiles = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('certificate_') && value instanceof File) {
        certificateFiles.push(value);
      }
    }

    // Upload certificates to R2 and store in database
    let uploadedCount = 0;
    for (let i = 0; i < certificateFiles.length; i++) {
      const file = certificateFiles[i];
      
      // Validate file type and size
      if (!file.type.includes('pdf') && !file.type.includes('image')) {
        console.warn(`Skipping invalid file type: ${file.type}`);
        continue;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        console.warn(`Skipping large file: ${file.size} bytes`);
        continue;
      }

      const r2Key = `professional-documents/${userId}/${Date.now()}_${i}_${file.name}`;
      
      try {
        const fileBuffer = await file.arrayBuffer();
        await c.env.R2_BUCKET.put(r2Key, fileBuffer, {
          httpMetadata: {
            contentType: file.type,
            contentDisposition: `attachment; filename="${file.name}"`,
          },
        });

        await c.env.DB.prepare(
          "INSERT INTO documents (user_id, professional_id, filename, original_filename, file_size, file_type, r2_key, document_type, description) VALUES (?, ?, ?, ?, ?, ?, ?, 'professional_certificate', 'Professional certification document')"
        ).bind(userId, result.id, r2Key, file.name, file.size, file.type, r2Key).run();
        
        uploadedCount++;
      } catch (uploadError) {
        console.error("File upload error:", uploadError);
        // Don't fail the whole registration for file upload errors
      }
    }

    // Update user type to professional
    await c.env.DB.prepare(
      "UPDATE users SET user_type = 'professional' WHERE id = ?"
    ).bind(userId).run();

    return c.json({ 
      professional: result, 
      success: true,
      uploaded_documents: uploadedCount,
      message: uploadedCount > 0 ? `Cadastro realizado com sucesso! ${uploadedCount} documentos enviados.` : 'Cadastro realizado com sucesso!'
    });
  } catch (error) {
    console.error("Professional registration error:", error);
    return c.json({ error: `Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}` }, 500);
  }
});

// Partner registration
app.post("/api/register-partner", async (c) => {
  try {
    const formData = await c.req.formData();
    const userId = parseInt(formData.get('user_id') as string);
    const companyName = formData.get('company_name') as string;
    const businessType = formData.get('business_type') as string;
    const contactInfo = formData.get('contact_info') as string;
    // Additional fields (currently not stored but available for future use)
    // const description = formData.get('description') as string;
    // const website = formData.get('website') as string;

    // Validate required fields
    if (!userId || !companyName || !businessType || !contactInfo) {
      return c.json({ error: "Missing required fields: user_id, company_name, business_type, contact_info are required" }, 400);
    }

    // Verify user exists
    const user = await c.env.DB.prepare(
      "SELECT id FROM users WHERE id = ?"
    ).bind(userId).first();

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Check if user already has a partner profile
    const existingPartner = await c.env.DB.prepare(
      "SELECT id FROM partners WHERE user_id = ?"
    ).bind(userId).first();

    if (existingPartner) {
      return c.json({ error: "User already has a partner profile" }, 400);
    }

    // Create partner record
    const result = await c.env.DB.prepare(
      "INSERT INTO partners (user_id, company_name, business_type, contact_info, commission_rate, is_verified, status) VALUES (?, ?, ?, ?, 0.70, false, 'pending') RETURNING *"
    ).bind(userId, companyName, businessType, contactInfo).first();

    if (!result) {
      return c.json({ error: "Failed to create partner record" }, 500);
    }

    // Handle document uploads
    const documentFiles = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('document_') && value instanceof File) {
        documentFiles.push(value);
      }
    }

    // Upload documents to R2 and store in database
    let uploadedCount = 0;
    for (let i = 0; i < documentFiles.length; i++) {
      const file = documentFiles[i];
      
      // Validate file type and size
      if (!file.type.includes('pdf') && !file.type.includes('image')) {
        console.warn(`Skipping invalid file type: ${file.type}`);
        continue;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        console.warn(`Skipping large file: ${file.size} bytes`);
        continue;
      }

      const r2Key = `partner-documents/${userId}/${Date.now()}_${i}_${file.name}`;
      
      try {
        const fileBuffer = await file.arrayBuffer();
        await c.env.R2_BUCKET.put(r2Key, fileBuffer, {
          httpMetadata: {
            contentType: file.type,
            contentDisposition: `attachment; filename="${file.name}"`,
          },
        });

        await c.env.DB.prepare(
          "INSERT INTO documents (user_id, filename, original_filename, file_size, file_type, r2_key, document_type, description) VALUES (?, ?, ?, ?, ?, ?, 'partner_document', 'Partner verification document')"
        ).bind(userId, r2Key, file.name, file.size, file.type, r2Key).run();
        
        uploadedCount++;
      } catch (uploadError) {
        console.error("File upload error:", uploadError);
        // Don't fail the whole registration for file upload errors
      }
    }

    // Update user type to partner
    await c.env.DB.prepare(
      "UPDATE users SET user_type = 'partner' WHERE id = ?"
    ).bind(userId).run();

    return c.json({ 
      partner: result, 
      success: true,
      uploaded_documents: uploadedCount,
      message: uploadedCount > 0 ? `Cadastro realizado com sucesso! ${uploadedCount} documentos enviados.` : 'Cadastro realizado com sucesso!'
    });
  } catch (error) {
    console.error("Partner registration error:", error);
    return c.json({ error: `Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}` }, 500);
  }
});

// Community chat routes
app.get("/api/community/:roomId/messages", async (c) => {
  const roomId = c.req.param("roomId");

  try {
    const messages = await c.env.DB.prepare(
      "SELECT cm.*, u.name as user_name FROM community_messages cm JOIN users u ON cm.user_id = u.id WHERE cm.room_id = ? ORDER BY cm.created_at ASC LIMIT 50"
    ).bind(roomId).all();

    return c.json({ messages: messages.results });
  } catch (error) {
    console.error("Error fetching community messages:", error);
    return c.json({ error: "Failed to fetch messages" }, 500);
  }
});

app.post("/api/community/:roomId/message", async (c) => {
  const roomId = c.req.param("roomId");
  const { content } = await c.req.json();
  const userId = 1; // TODO: Get from auth

  try {
    const result = await c.env.DB.prepare(
      "INSERT INTO community_messages (room_id, user_id, content) VALUES (?, ?, ?) RETURNING *"
    ).bind(roomId, userId, content).first();

    // Get user info and check if admin
    const user = await c.env.DB.prepare(
      "SELECT name, user_type, email FROM users WHERE id = ?"
    ).bind(userId).first() as any;

    // Check for superadmin emails
    const superAdminEmails = ['gtosegbot@', 'admgtoseg@', 'disparoseguroback@gmail.com'];
    const isAdmin = user?.user_type === 'superadmin' || 
                   (user?.email && superAdminEmails.some(email => user.email.includes(email)));

    return c.json({
      message: {
        ...result,
        user_name: isAdmin ? 'ADMIN' : (user?.name || 'Usuário')
      }
    });
  } catch (error) {
    console.error("Error sending community message:", error);
    return c.json({ error: "Failed to send message" }, 500);
  }
});

// Get documents
app.get("/api/documents", async (c) => {
  const appointmentId = c.req.query("appointment_id");
  const userId = c.req.query("user_id") || "1";
  const professionalId = c.req.query("professional_id");

  try {
    let query = "SELECT * FROM documents WHERE 1=1";
    const bindings: any[] = [];

    if (appointmentId) {
      query += " AND appointment_id = ?";
      bindings.push(appointmentId);
    }
    if (userId) {
      query += " AND user_id = ?";
      bindings.push(userId);
    }
    if (professionalId) {
      query += " AND professional_id = ?";
      bindings.push(professionalId);
    }

    query += " ORDER BY created_at DESC";

    const stmt = c.env.DB.prepare(query);
    const result = await stmt.bind(...bindings).all();

    return c.json({ documents: result.results });

  } catch (error) {
    console.error("Get documents error:", error);
    return c.json({ error: "Failed to fetch documents" }, 500);
  }
});

// Video content routes
app.get("/api/videos", async (c) => {
  const professionalId = c.req.query("professional_id");
  const category = c.req.query("category");
  const search = c.req.query("search");

  try {
    let query = `
      SELECT v.*, p.name as professional_name, pr.specialty as professional_specialty 
      FROM video_content v 
      JOIN professionals pr ON v.professional_id = pr.id 
      JOIN users p ON pr.user_id = p.id 
      WHERE 1=1
    `;
    const bindings: any[] = [];

    if (professionalId) {
      query += " AND v.professional_id = ?";
      bindings.push(professionalId);
    }
    if (category && category !== 'all') {
      query += " AND v.category = ?";
      bindings.push(category);
    }
    if (search) {
      query += " AND (v.title LIKE ? OR v.description LIKE ? OR p.name LIKE ?)";
      bindings.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += " ORDER BY v.created_at DESC";

    const stmt = c.env.DB.prepare(query);
    const result = await stmt.bind(...bindings).all();

    return c.json({ videos: result.results });

  } catch (error) {
    console.error("Get videos error:", error);
    return c.json({ error: "Failed to fetch videos" }, 500);
  }
});

app.post("/api/videos/upload", async (c) => {
  const formData = await c.req.formData();
  const professionalId = 1; // TODO: Get from auth
  
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const videoType = formData.get('video_type') as string;
  const youtubeUrl = formData.get('youtube_url') as string;
  const isPremium = formData.get('is_premium') === 'true';
  const durationMinutes = parseInt(formData.get('duration_minutes') as string) || null;
  const videoFile = formData.get('video_file') as File;

  try {
    let r2Key: string | null = null;

    if (videoType === 'recorded' && videoFile) {
      // Upload video file to R2
      r2Key = `videos/${professionalId}/${Date.now()}_${videoFile.name}`;
      await c.env.R2_BUCKET.put(r2Key, videoFile.stream(), {
        httpMetadata: {
          contentType: videoFile.type,
        },
      });
    }

    // Save to database
    const result = await c.env.DB.prepare(
      "INSERT INTO video_content (professional_id, title, description, video_type, youtube_url, r2_key, duration_minutes, category, is_premium) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *"
    ).bind(
      professionalId,
      title,
      description,
      videoType,
      youtubeUrl || null,
      r2Key,
      durationMinutes,
      category,
      isPremium
    ).first();

    return c.json({ video: result });

  } catch (error) {
    console.error("Video upload error:", error);
    return c.json({ error: "Upload failed" }, 500);
  }
});

app.post("/api/videos/:videoId/view", async (c) => {
  const videoId = c.req.param("videoId");

  try {
    await c.env.DB.prepare(
      "UPDATE video_content SET view_count = view_count + 1 WHERE id = ?"
    ).bind(videoId).run();

    return c.json({ success: true });

  } catch (error) {
    console.error("Video view error:", error);
    return c.json({ error: "Failed to record view" }, 500);
  }
});

app.get("/api/videos/:videoId/stream", async (c) => {
  const videoId = c.req.param("videoId");

  try {
    const video = await c.env.DB.prepare(
      "SELECT * FROM video_content WHERE id = ?"
    ).bind(videoId).first();

    if (!video || !video.r2_key) {
      return c.json({ error: "Video not found" }, 404);
    }

    const object = await c.env.R2_BUCKET.get(video.r2_key as string);
    if (!object) {
      return c.json({ error: "Video file not found" }, 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);

    return c.body(object.body, { headers });

  } catch (error) {
    console.error("Video stream error:", error);
    return c.json({ error: "Stream failed" }, 500);
  }
});

// Payment routes
app.post("/api/payments/create-intent", async (c) => {
  const { professional_id, amount, payment_method, appointment_details } = await c.req.json();
  const userId = 1; // TODO: Get from auth

  try {
    // Create appointment first
    const appointment = await c.env.DB.prepare(
      "INSERT INTO appointments (professional_id, user_id, title, start_time, end_time, amount_paid, payment_status) VALUES (?, ?, ?, ?, ?, ?, 'pending') RETURNING *"
    ).bind(
      professional_id,
      userId,
      appointment_details.title,
      appointment_details.start_time,
      new Date(new Date(appointment_details.start_time).getTime() + appointment_details.duration_minutes * 60000).toISOString(),
      amount
    ).first();

    if (!appointment) {
      return c.json({ error: "Failed to create appointment" }, 500);
    }

    // Create payment transaction
    const platformFee = amount * 0.2;
    const professionalShare = amount * 0.8;

    await c.env.DB.prepare(
      "INSERT INTO payment_transactions (user_id, professional_id, appointment_id, amount, payment_method, professional_share, platform_fee) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      userId,
      professional_id,
      appointment.id,
      amount,
      payment_method,
      professionalShare,
      platformFee
    ).run();

    // For demo purposes, return mock payment data
    return c.json({
      client_secret: `pi_mock_${appointment.id}`,
      appointment_id: appointment.id,
      payment_url: `https://example.com/pay/${appointment.id}` // Mock PIX URL
    });

  } catch (error) {
    console.error("Payment creation error:", error);
    return c.json({ error: "Payment creation failed" }, 500);
  }
});

// New payment routes for subscriptions and appointments
app.post("/api/payments/create-subscription", async (c) => {
  const { plan_name, amount, payment_method } = await c.req.json();
  const userId = 1; // TODO: Get from auth

  try {
    // Create subscription transaction
    const transaction = await c.env.DB.prepare(
      "INSERT INTO payment_transactions (user_id, amount, payment_method, payment_status) VALUES (?, ?, ?, 'completed') RETURNING *"
    ).bind(userId, amount, payment_method).first() as any;

    if (!transaction) {
      return c.json({ error: "Failed to create transaction" }, 500);
    }

    // Update user plan
    await c.env.DB.prepare(
      "UPDATE users SET plan = ? WHERE id = ?"
    ).bind(plan_name.toLowerCase(), userId).run();

    if (payment_method === 'pix') {
      return c.json({
        payment_id: `sub_${transaction.id}`,
        pix_qr_code: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", // Mock QR code
        payment_url: `https://pix.example.com/pay/${transaction.id}`,
      });
    }

    return c.json({
      payment_id: `sub_${transaction.id}`,
      transaction_id: `txn_${Date.now()}`,
      success: true,
    });

  } catch (error) {
    console.error("Subscription payment error:", error);
    return c.json({ error: "Payment failed" }, 500);
  }
});

app.post("/api/payments/create-appointment-payment", async (c) => {
  const { amount, payment_method, appointment_details } = await c.req.json();
  const userId = 1; // TODO: Get from auth

  try {
    // Create appointment
    const appointment = await c.env.DB.prepare(
      "INSERT INTO appointments (professional_id, user_id, title, start_time, end_time, amount_paid, payment_status) VALUES (?, ?, ?, ?, ?, ?, 'completed') RETURNING *"
    ).bind(
      1, // Mock professional ID
      userId,
      `Consulta com ${appointment_details.professional_name}`,
      appointment_details.appointment_date,
      new Date(new Date(appointment_details.appointment_date).getTime() + 60 * 60000).toISOString(), // 1 hour later
      amount
    ).first() as any;

    if (!appointment) {
      return c.json({ error: "Failed to create appointment" }, 500);
    }

    // Create payment transaction
    await c.env.DB.prepare(
      "INSERT INTO payment_transactions (user_id, appointment_id, amount, payment_method, payment_status, professional_share, platform_fee) VALUES (?, ?, ?, ?, 'completed', ?, ?)"
    ).bind(
      userId,
      appointment.id,
      amount,
      payment_method,
      amount * 0.8,
      amount * 0.2
    ).run();

    if (payment_method === 'pix') {
      return c.json({
        payment_id: `apt_${appointment.id}`,
        pix_qr_code: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", // Mock QR code
        payment_url: `https://pix.example.com/pay/${appointment.id}`,
      });
    }

    return c.json({
      payment_id: `apt_${appointment.id}`,
      transaction_id: `txn_${Date.now()}`,
      appointment_id: appointment.id,
      success: true,
    });

  } catch (error) {
    console.error("Appointment payment error:", error);
    return c.json({ error: "Payment failed" }, 500);
  }
});

app.get("/api/appointments/:appointmentId/payment-status", async (c) => {
  const appointmentId = c.req.param("appointmentId");

  try {
    const appointment = await c.env.DB.prepare(
      "SELECT payment_status FROM appointments WHERE id = ?"
    ).bind(appointmentId).first();

    return c.json({ 
      payment_status: appointment?.payment_status || 'pending' 
    });

  } catch (error) {
    console.error("Payment status error:", error);
    return c.json({ error: "Failed to check payment status" }, 500);
  }
});

// Professional availability
app.get("/api/professionals/:professionalId/available-slots", async (c) => {
  const professionalId = c.req.param("professionalId");
  const date = c.req.query("date");

  try {
    // Get existing appointments for the date
    const existingAppointments = await c.env.DB.prepare(
      "SELECT start_time, end_time FROM appointments WHERE professional_id = ? AND DATE(start_time) = ? AND status != 'cancelled'"
    ).bind(professionalId, date).all();

    // Generate available slots (9 AM to 6 PM, 30-minute intervals)
    const slots = [];
    const startHour = 9;
    const endHour = 18;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const slotDateTime = `${date}T${time}:00`;
        
        // Check if slot conflicts with existing appointments
        const isAvailable = !existingAppointments.results.some((apt: any) => {
          const slotStart = new Date(slotDateTime);
          const slotEnd = new Date(slotStart.getTime() + 30 * 60000); // 30 min slot
          const aptStart = new Date(apt.start_time);
          const aptEnd = new Date(apt.end_time);
          
          return (slotStart < aptEnd && slotEnd > aptStart);
        });

        slots.push({ time, available: isAvailable });
      }
    }

    return c.json({ slots });

  } catch (error) {
    console.error("Available slots error:", error);
    return c.json({ error: "Failed to fetch available slots" }, 500);
  }
});

// User profile routes
app.get("/api/user/profile", async (c) => {
  const userId = 1; // TODO: Get from auth

  try {
    const user = await c.env.DB.prepare(
      "SELECT * FROM users WHERE id = ?"
    ).bind(userId).first();

    return c.json({ user });

  } catch (error) {
    console.error("Get profile error:", error);
    return c.json({ error: "Failed to fetch profile" }, 500);
  }
});

app.put("/api/user/profile", async (c) => {
  const userId = 1; // TODO: Get from auth
  const { name, email, age } = await c.req.json();

  try {
    const result = await c.env.DB.prepare(
      "UPDATE users SET name = ?, email = ?, age = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *"
    ).bind(name, email, age, userId).first();

    return c.json({ user: result });

  } catch (error) {
    console.error("Update profile error:", error);
    return c.json({ error: "Failed to update profile" }, 500);
  }
});

app.get("/api/user/professional-profile", async (c) => {
  const userId = 1; // TODO: Get from auth

  try {
    const professional = await c.env.DB.prepare(
      "SELECT * FROM professionals WHERE user_id = ?"
    ).bind(userId).first();

    return c.json({ professional });

  } catch (error) {
    console.error("Get professional profile error:", error);
    return c.json({ error: "Failed to fetch professional profile" }, 500);
  }
});

app.get("/api/user/stats", async (c) => {
  try {
    // Mock stats for now
    const stats = {
      total_consultations: 0,
      total_videos_watched: 0,
      total_documents_uploaded: 0,
      streak_days: 0,
      level: 1,
      energy_points: 0
    };

    return c.json({ stats });

  } catch (error) {
    console.error("Get user stats error:", error);
    return c.json({ error: "Failed to fetch user stats" }, 500);
  }
});

// Helper functions
async function generateLiveKitToken(_env: Env, roomName: string, userId: number, userType: string): Promise<string> {
  // This would use the LiveKit SDK to generate a proper token
  // For now, returning a mock token
  return `mock_token_${roomName}_${userId}_${userType}`;
}

async function generateAIResponse(env: Env, userMessage: string, previousMessages: any[], anamnesisData: any[], analysis?: any): Promise<string> {
  // Build context from anamnesis
  const anamnesisContext = anamnesisData.length > 0 
    ? anamnesisData.map(item => `Q: ${item.question} A: ${item.response}`).join('\n')
    : 'Anamnese ainda não realizada ou dados não disponíveis.';

  // Build conversation history (last 6 messages)
  const recentMessages = previousMessages.slice(0, 6);
  const conversationHistory = recentMessages.length > 0
    ? recentMessages.reverse().map(msg => 
        `${msg.message_type === 'user' ? 'Usuário' : 'Dra. Clara'}: ${msg.content}`
      ).join('\n')
    : 'Esta é a primeira mensagem da conversa.';

  // Risk analysis for emotional support
  const emotionalAnalysis = analyzeEmotionalRisk(userMessage);
  const combinedAnalysis = analysis || emotionalAnalysis;

  const prompt = `Você é a Dra. Clara Mendes, uma psicóloga clínica experiente e empática. Responda de forma concisa, natural e direta.

CONTEXTO DA ANAMNESE:
${anamnesisContext}

HISTÓRICO RECENTE DA CONVERSA:
${conversationHistory}

MENSAGEM ATUAL: "${userMessage}"

ANÁLISE EMOCIONAL:
- Nível de risco: ${combinedAnalysis.score}/10
- Tom emocional: ${combinedAnalysis.emotionalTone}
- Estratégia: ${combinedAnalysis.strategy}

INSTRUÇÕES CRÍTICAS:
${combinedAnalysis.score >= 8 ? `
🔴 URGENTE - Usuário em crise:
- Valide a dor rapidamente
- CVV: 188 (24h, gratuito)
- Tom direto e acolhedor
` : combinedAnalysis.score >= 6 ? `
🟡 ATENÇÃO:
- Explore com cuidado
- Sugira recursos do app
- Proximidade empática
` : `
🟢 CONVERSA NORMAL:
- Natural e contextual
- Use insights da anamnese
- Conecte aos recursos quando relevante
`}

REGRAS OBRIGATÓRIAS:
- MÁXIMO 80 palavras
- Seja direta e específica
- Use o contexto da anamnese
- Tom acolhedor mas objetivo
- Evite repetições ou textos longos
- Foque no essencial

Responda de forma CONCISA como a Dra. Clara:`;

  try {
    // Primary: OpenAI GPT-4o-mini (fast and contextual)
    if (env.OPENAI_API_KEY) {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Você é a Dra. Clara Mendes, uma psicóloga clínica empática e experiente. Suas respostas são sempre contextuais, personalizadas e baseadas no histórico específico de cada pessoa.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 150,
          temperature: 0.8,
          frequency_penalty: 0.3,
          presence_penalty: 0.3,
        }),
      });

      if (openaiResponse.ok) {
        const data = await openaiResponse.json() as any;
        const response = data.choices?.[0]?.message?.content;
        if (response && response.length > 50) {
          return response;
        }
      }
    }

    // Fallback: OpenRouter with Claude
    if (env.OPENROUTER_API_KEY) {
      const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://quero-conversar.app',
          'X-Title': 'Quero Conversar - Dra. Clara'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3-haiku',
          messages: [
            {
              role: 'system',
              content: 'Você é a Dra. Clara Mendes, psicóloga especializada em escuta empática e apoio contextualizado.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 120,
          temperature: 0.7,
        }),
      });

      if (openRouterResponse.ok) {
        const data = await openRouterResponse.json() as any;
        const response = data.choices?.[0]?.message?.content;
        if (response && response.length > 50) {
          return response;
        }
      }
    }

    // Contextual fallback response
    return generateContextualFallback(userMessage, combinedAnalysis, anamnesisData);

  } catch (error) {
    console.error('AI response error:', error);
    return generateContextualFallback(userMessage, combinedAnalysis, anamnesisData);
  }
}

function analyzeEmotionalRisk(message: string): { score: number; emotionalTone: string; strategy: string } {
  const riskKeywords = {
    high: ['suicídio', 'morrer', 'acabar com tudo', 'não aguento mais', 'sem saída', 'desespero'],
    medium: ['triste', 'ansioso', 'deprimido', 'sozinho', 'perdido', 'preocupado', 'medo'],
    low: ['cansado', 'estressado', 'confuso', 'irritado', 'frustrado']
  };

  const lowerMessage = message.toLowerCase();
  
  let score = 3;
  let emotionalTone = 'neutro';
  let strategy = 'conversa empática';

  // Check for high-risk indicators
  if (riskKeywords.high.some(word => lowerMessage.includes(word))) {
    score = 9;
    emotionalTone = 'crise emocional';
    strategy = 'intervenção imediata';
  } else if (riskKeywords.medium.some(word => lowerMessage.includes(word))) {
    score = 6;
    emotionalTone = 'vulnerabilidade emocional';
    strategy = 'suporte intensivo';
  } else if (riskKeywords.low.some(word => lowerMessage.includes(word))) {
    score = 4;
    emotionalTone = 'desconforto emocional';
    strategy = 'exploração empática';
  } else if (lowerMessage.includes('obrigad') || lowerMessage.includes('melhor') || lowerMessage.includes('bem')) {
    score = 2;
    emotionalTone = 'positivo';
    strategy = 'reforço positivo';
  }

  return { score, emotionalTone, strategy };
}

function generateContextualFallback(_userMessage: string, analysis: any, anamnesisData: any[]): string {
  if (analysis.score >= 8) {
    return `Percebo que você está em momento difícil. Sua dor é válida.

🔴 URGENTE: CVV 188 (24h, gratuito)
📱 App: "Profissionais" ou "Comunidade"

Você não está sozinho(a). Procure ajuda agora.`;
  }

  if (analysis.score >= 6) {
    return `Momento desafiador, mas você teve coragem de compartilhar.

💙 Recursos do app:
• Comunidade: apoio de pessoas que entendem
• Profissionais: consulta personalizada

Como tem lidado com esses sentimentos?`;
  }

  // Contextual responses based on anamnesis
  if (anamnesisData.length > 0) {
    const responses = [
      `Lembro da nossa anamnese - você tem força de reflexão. Como pode usar isso agora?`,
      `Natural sentir isso. Que estratégias já tentou para situações similares?`,
      `Você tem recursos internos valiosos. Como podemos ativá-los?`,
      `Admiro sua honestidade. O que mudou desde nossa conversa inicial?`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // General empathetic responses
  const generalResponses = [
    `Entendo. Como se sente compartilhando isso comigo?`,
    `Valioso você confiar. Que aspectos quer explorar?`,
    `Há algo importante aí. Como costuma lidar com isso?`,
    `Boa consciência! O que seria mais útil agora?`
  ];

  return generalResponses[Math.floor(Math.random() * generalResponses.length)];
}

// Note: This function was replaced by generateContextualFallback for better context handling

async function generateDailyTasks(db: D1Database, userId: number): Promise<void> {
  // Check if user already has tasks for today
  const existingTasks = await db.prepare(
    "SELECT COUNT(*) as count FROM daily_tasks WHERE user_id = ? AND task_date = DATE('now')"
  ).bind(userId).first() as any;

  if (existingTasks?.count > 0) {
    return; // User already has tasks for today
  }

  // Get user level to determine difficulty
  const userStats = await db.prepare(
    "SELECT level FROM user_stats WHERE user_id = ?"
  ).bind(userId).first() as any;

  const level = userStats?.level || 1;
  let difficulty = 'easy';
  if (level >= 4 && level <= 6) difficulty = 'medium';
  if (level >= 7) difficulty = 'hard';

  // Get active tasks from templates instead of hardcoded
  const taskTemplates = await db.prepare(
    "SELECT * FROM task_templates WHERE difficulty = ? AND is_active = true ORDER BY RANDOM() LIMIT 4"
  ).bind(difficulty).all();

  if (taskTemplates.results.length > 0) {
    const stmt = db.prepare(
      "INSERT INTO daily_tasks (user_id, title, description, category, points, difficulty, task_date) VALUES (?, ?, ?, ?, ?, ?, DATE('now'))"
    );

    for (const task of taskTemplates.results as any[]) {
      await stmt.bind(
        userId,
        task.title,
        task.description,
        task.category,
        task.points,
        difficulty
      ).run();
    }
    return;
  }

  // Fallback to hardcoded tasks if templates not available

  const tasksByDifficulty = {
    easy: [
      {
        title: "Pratique 5 minutos de respiração profunda",
        description: "Reserve um momento para se conectar consigo mesmo",
        category: "mental",
        points: 30
      },
      {
        title: "Escreva 3 coisas pelas quais você é grato",
        description: "Cultive a gratidão em seu dia a dia",
        category: "spiritual",
        points: 40
      },
      {
        title: "Faça uma caminhada de 10 minutos",
        description: "Cuide do seu corpo e mente ao ar livre",
        category: "physical",
        points: 50
      },
      {
        title: "Envie uma mensagem carinhosa para alguém",
        description: "Fortaleça seus relacionamentos",
        category: "mental",
        points: 35
      }
    ],
    medium: [
      {
        title: "Medite por 15 minutos",
        description: "Aprofunde sua prática de mindfulness",
        category: "spiritual",
        points: 60
      },
      {
        title: "Faça 30 minutos de exercício",
        description: "Desafie seus limites físicos",
        category: "physical",
        points: 80
      },
      {
        title: "Leia um capítulo de um livro de crescimento pessoal",
        description: "Invista em seu desenvolvimento",
        category: "mental",
        points: 70
      },
      {
        title: "Ajude alguém sem esperar nada em troca",
        description: "Pratique a generosidade genuína",
        category: "spiritual",
        points: 90
      }
    ],
    hard: [
      {
        title: "Mantenha um jejum intermitente de 16 horas",
        description: "Desafie sua disciplina e saúde",
        category: "physical",
        points: 120
      },
      {
        title: "Complete um projeto que você vem adiando",
        description: "Supere a procrastinação",
        category: "mental",
        points: 150
      },
      {
        title: "Tenha uma conversa difícil que você vem evitando",
        description: "Desenvolva coragem emocional",
        category: "mental",
        points: 100
      },
      {
        title: "Pratique uma nova habilidade por 1 hora",
        description: "Saia da zona de conforto",
        category: "mental",
        points: 110
      }
    ]
  };

  const tasks = tasksByDifficulty[difficulty as keyof typeof tasksByDifficulty];
  
  const stmt = db.prepare(
    "INSERT INTO daily_tasks (user_id, title, description, category, points, difficulty, task_date) VALUES (?, ?, ?, ?, ?, ?, DATE('now'))"
  );

  for (const task of tasks) {
    await stmt.bind(
      userId,
      task.title,
      task.description,
      task.category,
      task.points,
      difficulty
    ).run();
  }
}

// Admin routes for task templates
app.get("/api/admin/task-templates", async (c) => {
  try {
    const templates = await c.env.DB.prepare(
      "SELECT * FROM task_templates ORDER BY difficulty, category, created_at DESC"
    ).all();

    return c.json({ templates: templates.results });
  } catch (error) {
    console.error("Error fetching task templates:", error);
    return c.json({ error: "Failed to fetch task templates" }, 500);
  }
});

app.post("/api/admin/task-templates", async (c) => {
  const { title, description, category, points, difficulty } = await c.req.json();
  const adminId = 1; // TODO: Get from auth

  try {
    const result = await c.env.DB.prepare(
      "INSERT INTO task_templates (title, description, category, points, difficulty, created_by) VALUES (?, ?, ?, ?, ?, ?) RETURNING *"
    ).bind(title, description, category, points, difficulty, adminId).first();

    return c.json({ template: result });
  } catch (error) {
    console.error("Error creating task template:", error);
    return c.json({ error: "Failed to create task template" }, 500);
  }
});

app.patch("/api/admin/task-templates/:id/toggle", async (c) => {
  const id = c.req.param("id");
  const { is_active } = await c.req.json();

  try {
    await c.env.DB.prepare(
      "UPDATE task_templates SET is_active = ? WHERE id = ?"
    ).bind(is_active, id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error toggling task template:", error);
    return c.json({ error: "Failed to toggle task template" }, 500);
  }
});

app.delete("/api/admin/task-templates/:id", async (c) => {
  const id = c.req.param("id");

  try {
    await c.env.DB.prepare(
      "DELETE FROM task_templates WHERE id = ?"
    ).bind(id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting task template:", error);
    return c.json({ error: "Failed to delete task template" }, 500);
  }
});

// Admin mock data management routes
app.get("/api/admin/mock-professionals", async (c) => {
  try {
    const professionals = await c.env.DB.prepare(`
      SELECT p.*, u.name 
      FROM professionals p 
      JOIN users u ON p.user_id = u.id 
      WHERE u.email LIKE '%example.com%' OR u.email LIKE '%mock%' OR u.email LIKE '%demo%'
      ORDER BY p.created_at DESC
    `).all();

    return c.json({ data: professionals.results });
  } catch (error) {
    console.error("Error fetching mock professionals:", error);
    return c.json({ error: "Failed to fetch mock professionals" }, 500);
  }
});

app.get("/api/admin/mock-users", async (c) => {
  try {
    const users = await c.env.DB.prepare(`
      SELECT * FROM users 
      WHERE email LIKE '%example.com%' OR email LIKE '%mock%' OR email LIKE '%demo%' 
      ORDER BY created_at DESC
    `).all();

    return c.json({ data: users.results });
  } catch (error) {
    console.error("Error fetching mock users:", error);
    return c.json({ error: "Failed to fetch mock users" }, 500);
  }
});

app.get("/api/admin/mock-appointments", async (c) => {
  try {
    const appointments = await c.env.DB.prepare(`
      SELECT a.* FROM appointments a
      JOIN users u ON a.user_id = u.id 
      WHERE u.email LIKE '%example.com%' OR u.email LIKE '%mock%' OR u.email LIKE '%demo%'
      ORDER BY a.created_at DESC
    `).all();

    return c.json({ data: appointments.results });
  } catch (error) {
    console.error("Error fetching mock appointments:", error);
    return c.json({ error: "Failed to fetch mock appointments" }, 500);
  }
});

app.get("/api/admin/mock-documents", async (c) => {
  try {
    const documents = await c.env.DB.prepare(`
      SELECT d.* FROM documents d
      JOIN users u ON d.user_id = u.id 
      WHERE u.email LIKE '%example.com%' OR u.email LIKE '%mock%' OR u.email LIKE '%demo%'
      ORDER BY d.created_at DESC
    `).all();

    return c.json({ data: documents.results });
  } catch (error) {
    console.error("Error fetching mock documents:", error);
    return c.json({ error: "Failed to fetch mock documents" }, 500);
  }
});

app.delete("/api/admin/delete-mock-data/:category", async (c) => {
  const category = c.req.param("category");

  try {
    if (category === 'all') {
      // Delete all mock data
      await c.env.DB.prepare(`DELETE FROM professionals WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%example.com%' OR email LIKE '%mock%' OR email LIKE '%demo%')`).run();
      await c.env.DB.prepare(`DELETE FROM appointments WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%example.com%' OR email LIKE '%mock%' OR email LIKE '%demo%')`).run();
      await c.env.DB.prepare(`DELETE FROM documents WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%example.com%' OR email LIKE '%mock%' OR email LIKE '%demo%')`).run();
      await c.env.DB.prepare(`DELETE FROM users WHERE email LIKE '%example.com%' OR email LIKE '%mock%' OR email LIKE '%demo%'`).run();
    } else if (category === 'professionals') {
      await c.env.DB.prepare(`DELETE FROM professionals WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%example.com%' OR email LIKE '%mock%' OR email LIKE '%demo%')`).run();
    } else if (category === 'users') {
      await c.env.DB.prepare(`DELETE FROM users WHERE email LIKE '%example.com%' OR email LIKE '%mock%' OR email LIKE '%demo%'`).run();
    } else if (category === 'appointments') {
      await c.env.DB.prepare(`DELETE FROM appointments WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%example.com%' OR email LIKE '%mock%' OR email LIKE '%demo%')`).run();
    } else if (category === 'documents') {
      await c.env.DB.prepare(`DELETE FROM documents WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%example.com%' OR email LIKE '%mock%' OR email LIKE '%demo%')`).run();
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting mock data:", error);
    return c.json({ error: "Failed to delete mock data" }, 500);
  }
});

app.delete("/api/admin/delete-mock-item/:category/:id", async (c) => {
  const category = c.req.param("category");
  const id = c.req.param("id");

  try {
    if (category === 'professionals') {
      await c.env.DB.prepare("DELETE FROM professionals WHERE id = ?").bind(id).run();
    } else if (category === 'users') {
      await c.env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
    } else if (category === 'appointments') {
      await c.env.DB.prepare("DELETE FROM appointments WHERE id = ?").bind(id).run();
    } else if (category === 'documents') {
      await c.env.DB.prepare("DELETE FROM documents WHERE id = ?").bind(id).run();
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting mock item:", error);
    return c.json({ error: "Failed to delete mock item" }, 500);
  }
});

// Admin notifications
app.get("/api/admin/notifications", async (c) => {
  try {
    const notifications = await c.env.DB.prepare(
      "SELECT * FROM admin_notifications ORDER BY created_at DESC"
    ).all();

    return c.json({ notifications: notifications.results });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return c.json({ error: "Failed to fetch notifications" }, 500);
  }
});

app.post("/api/admin/notifications", async (c) => {
  const { page_section, title, message, start_date, end_date } = await c.req.json();
  const adminId = 1; // TODO: Get from auth

  try {
    const result = await c.env.DB.prepare(
      "INSERT INTO admin_notifications (admin_id, page_section, title, message, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?) RETURNING *"
    ).bind(adminId, page_section, title, message, start_date || null, end_date || null).first();

    return c.json({ notification: result });
  } catch (error) {
    console.error("Error creating notification:", error);
    return c.json({ error: "Failed to create notification" }, 500);
  }
});

app.patch("/api/admin/notifications/:id/toggle", async (c) => {
  const id = c.req.param("id");
  const { is_active } = await c.req.json();

  try {
    await c.env.DB.prepare(
      "UPDATE admin_notifications SET is_active = ? WHERE id = ?"
    ).bind(is_active, id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error toggling notification:", error);
    return c.json({ error: "Failed to toggle notification" }, 500);
  }
});

app.delete("/api/admin/notifications/:id", async (c) => {
  const id = c.req.param("id");

  try {
    await c.env.DB.prepare(
      "DELETE FROM admin_notifications WHERE id = ?"
    ).bind(id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return c.json({ error: "Failed to delete notification" }, 500);
  }
});

// Professional chat routes
app.get("/api/chat/professional/:professionalId/messages", async (c) => {
  const professionalId = c.req.param("professionalId");
  const userId = 1; // TODO: Get from auth

  try {
    const messages = await c.env.DB.prepare(`
      SELECT pm.*, u.name as user_name 
      FROM professional_messages pm 
      JOIN users u ON pm.user_id = u.id 
      WHERE pm.professional_id = ? AND (pm.user_id = ? OR pm.professional_id IN (
        SELECT id FROM professionals WHERE user_id = ?
      ))
      ORDER BY pm.created_at ASC LIMIT 50
    `).bind(professionalId, userId, userId).all();

    return c.json({ messages: messages.results });
  } catch (error) {
    console.error("Error fetching professional chat messages:", error);
    return c.json({ error: "Failed to fetch messages" }, 500);
  }
});

app.post("/api/chat/professional/:professionalId/message", async (c) => {
  const { content, message_type } = await c.req.json();
  const userId = 1; // TODO: Get from auth

  try {
    // For now, just create a mock message since we don't have professional_messages table
    const result = {
      id: Date.now(),
      user_id: userId,
      user_name: message_type === 'system' ? 'Sistema' : 'Você',
      content,
      timestamp: new Date().toISOString(),
      message_type: message_type || 'chat'
    };

    return c.json({ message: result });
  } catch (error) {
    console.error("Error sending professional message:", error);
    return c.json({ error: "Failed to send message" }, 500);
  }
});

// Get professionals with basic info
app.get("/api/professionals/:id", async (c) => {
  const id = c.req.param("id");

  try {
    const professional = await c.env.DB.prepare(`
      SELECT p.*, u.name 
      FROM professionals p 
      JOIN users u ON p.user_id = u.id 
      WHERE p.id = ?
    `).bind(id).first();

    if (!professional) {
      return c.json({ error: "Professional not found" }, 404);
    }

    return c.json({ 
      professional: {
        ...professional,
        is_online: Math.random() > 0.5 // Mock online status
      }
    });
  } catch (error) {
    console.error("Error fetching professional:", error);
    return c.json({ error: "Failed to fetch professional" }, 500);
  }
});

// Moderation routes
app.get("/api/moderator/chat", async (c) => {
  try {
    const messages = await c.env.DB.prepare(`
      SELECT mc.*, u.name as moderator_name, m.specialty 
      FROM moderator_chat mc 
      JOIN moderators m ON mc.moderator_id = m.id 
      JOIN users u ON m.user_id = u.id 
      ORDER BY mc.created_at DESC LIMIT 100
    `).all();

    return c.json({ messages: messages.results });
  } catch (error) {
    console.error("Error fetching moderator chat:", error);
    return c.json({ error: "Failed to fetch moderator chat" }, 500);
  }
});

app.post("/api/moderator/chat", async (c) => {
  const { content, message_type, room_mention, related_report_id } = await c.req.json();
  const userId = 1; // TODO: Get from auth

  try {
    // Check if user is a moderator
    const moderator = await c.env.DB.prepare(
      "SELECT id FROM moderators WHERE user_id = ? AND is_active = true"
    ).bind(userId).first();

    if (!moderator) {
      return c.json({ error: "Access denied - not a moderator" }, 403);
    }

    const result = await c.env.DB.prepare(
      "INSERT INTO moderator_chat (moderator_id, content, message_type, room_mention, related_report_id) VALUES (?, ?, ?, ?, ?) RETURNING *"
    ).bind(moderator.id, content, message_type || 'discussion', room_mention, related_report_id).first();

    return c.json({ message: result });
  } catch (error) {
    console.error("Error sending moderator message:", error);
    return c.json({ error: "Failed to send message" }, 500);
  }
});

app.post("/api/moderator/report", async (c) => {
  const { message_id, user_id, room_id, report_type, description } = await c.req.json();
  const reportedBy = 1; // TODO: Get from auth

  try {
    const result = await c.env.DB.prepare(
      "INSERT INTO moderation_reports (reported_by, message_id, user_id, room_id, report_type, description) VALUES (?, ?, ?, ?, ?, ?) RETURNING *"
    ).bind(reportedBy, message_id, user_id, room_id, report_type, description).first();

    return c.json({ report: result });
  } catch (error) {
    console.error("Error creating report:", error);
    return c.json({ error: "Failed to create report" }, 500);
  }
});

app.get("/api/moderator/reports", async (c) => {
  try {
    const reports = await c.env.DB.prepare(`
      SELECT mr.*, u1.name as reported_by_name, u2.name as reported_user_name, cr.name as room_name
      FROM moderation_reports mr 
      JOIN users u1 ON mr.reported_by = u1.id 
      LEFT JOIN users u2 ON mr.user_id = u2.id 
      LEFT JOIN community_rooms cr ON mr.room_id = cr.id 
      ORDER BY mr.created_at DESC
    `).all();

    return c.json({ reports: reports.results });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return c.json({ error: "Failed to fetch reports" }, 500);
  }
});

// Policies routes
app.get("/api/policies", async (c) => {
  try {
    const policies = await c.env.DB.prepare(
      "SELECT * FROM app_policies WHERE is_active = true ORDER BY policy_type, version DESC"
    ).all();

    return c.json({ policies: policies.results });
  } catch (error) {
    console.error("Error fetching policies:", error);
    return c.json({ error: "Failed to fetch policies" }, 500);
  }
});

app.get("/api/policies/:type", async (c) => {
  const type = c.req.param("type");

  try {
    const policy = await c.env.DB.prepare(
      "SELECT * FROM app_policies WHERE policy_type = ? AND is_active = true ORDER BY version DESC LIMIT 1"
    ).bind(type).first();

    return c.json({ policy });
  } catch (error) {
    console.error("Error fetching policy:", error);
    return c.json({ error: "Failed to fetch policy" }, 500);
  }
});

app.post("/api/admin/policies", async (c) => {
  const { title, content, policy_type } = await c.req.json();
  const adminId = 1; // TODO: Get from auth

  try {
    const result = await c.env.DB.prepare(
      "INSERT INTO app_policies (title, content, policy_type, created_by) VALUES (?, ?, ?, ?) RETURNING *"
    ).bind(title, content, policy_type, adminId).first();

    return c.json({ policy: result });
  } catch (error) {
    console.error("Error creating policy:", error);
    return c.json({ error: "Failed to create policy" }, 500);
  }
});

// Admin dashboard data
app.get("/api/admin/dashboard-stats", async (c) => {
  try {
    const stats = await Promise.all([
      c.env.DB.prepare("SELECT COUNT(*) as count FROM users").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM professionals").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM appointments").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM community_messages WHERE DATE(created_at) = DATE('now')").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM moderation_reports WHERE status = 'pending'").first()
    ]);

    return c.json({
      total_users: stats[0]?.count || 0,
      total_professionals: stats[1]?.count || 0,
      total_appointments: stats[2]?.count || 0,
      messages_today: stats[3]?.count || 0,
      pending_reports: stats[4]?.count || 0
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return c.json({ error: "Failed to fetch admin stats" }, 500);
  }
});

export default app;
