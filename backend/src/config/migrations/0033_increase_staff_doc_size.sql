-- Migration 0033: increase staff doc size to handle large base64 strings
ALTER TABLE staff MODIFY photo LONGTEXT;
ALTER TABLE staff MODIFY aadhar_doc LONGTEXT;
ALTER TABLE staff MODIFY id_doc LONGTEXT;
ALTER TABLE staff MODIFY certificate_doc LONGTEXT;
