const db = require('../config/db');

// Helper function to parse JSON fields
const parseFacility = (facility) => {
  if (!facility) return facility;
  return {
    ...facility,
    heroImage: facility.hero_image,
    shortDesc: facility.short_description,
    equipments: typeof facility.equipments === 'string' ? JSON.parse(facility.equipments || '[]') : (facility.equipments || []),
    workouts: typeof facility.workouts === 'string' ? JSON.parse(facility.workouts || '[]') : (facility.workouts || []),
    facilities: typeof facility.facilities === 'string' ? JSON.parse(facility.facilities || '[]') : (facility.facilities || []),
    gallery: typeof facility.gallery === 'string' ? JSON.parse(facility.gallery || '[]') : (facility.gallery || [])
  };
};

async function getAllFacilities(req, res) {
  try {
    // ensure active column exists, fallback to true for older rows
    const [rows] = await db.query(
      'SELECT *, COALESCE(active, TRUE) AS active FROM gym_facilities ORDER BY created_at DESC'
    );
    res.json(rows.map(parseFacility));
  } catch (err) {
    console.error('getAllFacilities error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function getFacilityById(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    let query;
    let params;
    if (isNum) {
      query = `SELECT *, COALESCE(active, TRUE) AS active FROM gym_facilities WHERE id = ?`;
      params = [idNum];
    } else {
      query = `SELECT *, COALESCE(active, TRUE) AS active FROM gym_facilities WHERE slug = ?`;
      params = [id];
    }
    
    const [rows] = await db.query(query, params);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Facility not found' });
    }
    
    res.json(parseFacility(rows[0]));
  } catch (err) {
    console.error('getFacilityById error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function createFacility(req, res) {
  console.log('=== CREATE FACILITY REQUEST ===');
  console.log('Raw body keys:', Object.keys(req.body));
  
  const {
    title, slug, shortDesc, description, heroImage,
    equipments, workouts, facilities, gallery,
    active // new boolean flag
  } = req.body;

  console.log('Extracted fields:', {
    title: typeof title,
    shortDesc: typeof shortDesc,
    description: typeof description,
    heroImage: heroImage ? `${heroImage.substring(0, 50)}...` : null,
    equipments: Array.isArray(equipments) ? `array[${equipments.length}]` : typeof equipments,
    workouts: Array.isArray(workouts) ? `array[${workouts.length}]` : typeof workouts,
    facilities: Array.isArray(facilities) ? `array[${facilities.length}]` : typeof facilities,
    gallery: Array.isArray(gallery) ? `array[${gallery.length}]` : typeof gallery
  });

  try {
    // Validate required fields
    if (!title || !shortDesc) {
      console.log('Validation failed: title or shortDesc missing');
      return res.status(400).json({ message: "Title and short description are required" });
    }

    const facilitySlug = slug || title.toLowerCase().replace(/\s+/g, "-");
    console.log('Generated slug:', facilitySlug);

    const equipmentsJson = JSON.stringify(Array.isArray(equipments) ? equipments : []);
    const workoutsJson = JSON.stringify(Array.isArray(workouts) ? workouts : []);
    const facilitiesJson = JSON.stringify(Array.isArray(facilities) ? facilities : []);
    const galleryJson = JSON.stringify(Array.isArray(gallery) ? gallery : []);

    console.log('About to execute INSERT with:', {
      title, facilitySlug, shortDesc, 
      equipmentsJsonLength: equipmentsJson.length,
      workoutsJsonLength: workoutsJson.length,
      facilitiesJsonLength: facilitiesJson.length,
      galleryJsonLength: galleryJson.length
    });

    const [result] = await db.query(
      `INSERT INTO gym_facilities
      (title, slug, short_description, description, hero_image, 
       equipments, workouts, facilities, gallery, active)
      VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        title, 
        facilitySlug, 
        shortDesc, 
        description || null, 
        heroImage || null,
        equipmentsJson,
        workoutsJson,
        facilitiesJson,
        galleryJson,
        active === false ? 0 : 1
      ]
    );

    // Fetch the created facility
    const [rows] = await db.query('SELECT * FROM gym_facilities WHERE id = ?', [result.insertId]);
    console.log('✅ Facility created successfully! ID:', rows[0].id);
    res.json(parseFacility(rows[0]));

  } catch (err) {
    console.error('❌ createFacility error:', err.message);
    console.error('Stack:', err.stack);
    console.error('Code:', err.code);
    console.error('Detail:', err.detail);
    res.status(500).json({ 
      message: "Server error", 
      error: err.message,
      detail: err.detail,
      code: err.code 
    });
  }
}

async function updateFacility(req, res) {
  const { id } = req.params;
  const idNum = parseInt(id, 10);
  const isNum = !isNaN(idNum);
  
  // require full payload; callers should provide all fields or use toggle endpoint
  const {
    title, slug, shortDesc, description, heroImage,
    equipments, workouts, facilities, gallery,
    active
  } = req.body;

  try {
    const facilitySlug = slug || title.toLowerCase().replace(/\s+/g, "-");

    let query;
    let params;
    
    const baseParams = [
      title, 
      facilitySlug, 
      shortDesc, 
      description || null, 
      heroImage || null,
      JSON.stringify(Array.isArray(equipments) ? equipments : []),
      JSON.stringify(Array.isArray(workouts) ? workouts : []),
      JSON.stringify(Array.isArray(facilities) ? facilities : []),
      JSON.stringify(Array.isArray(gallery) ? gallery : []),
      active === false ? 0 : 1
    ];

    if (isNum) {
      query = `UPDATE gym_facilities SET
        title=?, slug=?, short_description=?, description=?,
        hero_image=?, equipments=?, workouts=?, facilities=?,
        gallery=?, active=?, updated_at=CURRENT_TIMESTAMP
       WHERE id=?`;
      params = [...baseParams, idNum];
    } else {
      query = `UPDATE gym_facilities SET
        title=?, slug=?, short_description=?, description=?,
        hero_image=?, equipments=?, workouts=?, facilities=?,
        gallery=?, active=?, updated_at=CURRENT_TIMESTAMP
       WHERE slug=?`;
      params = [...baseParams, id];
    }

    const [result] = await db.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    // Fetch the updated facility
    let fetchQuery;
    let fetchParams;
    if (isNum) {
      fetchQuery = 'SELECT * FROM gym_facilities WHERE id = ?';
      fetchParams = [idNum];
    } else {
      fetchQuery = 'SELECT * FROM gym_facilities WHERE slug = ?';
      fetchParams = [id];
    }

    const [rows] = await db.query(fetchQuery, fetchParams);
    res.json(parseFacility(rows[0]));

  } catch (err) {
    console.error('updateFacility error', err);
    res.status(500).json({ message: "Server error" });
  }
}

async function deleteFacility(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    let query;
    let params;
    if (isNum) {
      query = `DELETE FROM gym_facilities WHERE id = ?`;
      params = [idNum];
    } else {
      query = `DELETE FROM gym_facilities WHERE slug = ?`;
      params = [id];
    }

    const [result] = await db.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Facility not found' });
    }
    res.json({ success: true, message: 'Facility deleted successfully' });
  } catch (err) {
    console.error('deleteFacility error', err);
    res.status(500).json({ error: 'Delete failed' });
  }
}

// flip active flag without touching other fields
async function toggleFacilityActive(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    let query;
    let params;
    if (isNum) {
      query = `UPDATE gym_facilities SET active = IF(active, 0, 1), updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      params = [idNum];
    } else {
      query = `UPDATE gym_facilities SET active = IF(active, 0, 1), updated_at = CURRENT_TIMESTAMP WHERE slug = ?`;
      params = [id];
    }

    const [result] = await db.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    // Fetch the updated active status
    let fetchQuery;
    let fetchParams;
    if (isNum) {
      fetchQuery = 'SELECT active FROM gym_facilities WHERE id = ?';
      fetchParams = [idNum];
    } else {
      fetchQuery = 'SELECT active FROM gym_facilities WHERE slug = ?';
      fetchParams = [id];
    }

    const [rows] = await db.query(fetchQuery, fetchParams);
    res.json(rows[0]);
  } catch (err) {
    console.error('toggleFacilityActive error', err);
    res.status(500).json({ error: 'Update failed' });
  }
}

module.exports = { getAllFacilities, getFacilityById, createFacility, updateFacility, deleteFacility, toggleFacilityActive };
