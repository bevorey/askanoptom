// find this:
const raw     = message.content[0].text;
const cleaned = raw.replace(/```json|```/g, '').trim();
const data    = JSON.parse(cleaned);

// replace with:
const raw     = message.content[0].text;
const cleaned = raw.replace(/```json|```/g, '').trim();

// If Claude hit the token limit, the JSON may be truncated.
// Try to salvage it by closing any open structures.
let data;
try {
  data = JSON.parse(cleaned);
} catch {
  // Attempt repair — find the last complete field
  const truncated = cleaned.substring(0, cleaned.lastIndexOf('",')) + '"}}';
  data = JSON.parse(truncated);
}