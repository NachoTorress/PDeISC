import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { proposalBody, reviewBody, httpsLinkError } from '../src/validators/projects.mjs';

const valid = { name: 'Robot 2026', description: 'Un proyecto de automatización para la exposición.', course: '6° 1°', imageUrl: 'https://example.com/image.png', videoUrl: '', isSoftwareProject: false, githubUrl: '', websiteUrl: '', memberIds: [randomUUID()], teacherIds: [randomUUID()], subjects: ['Programación'], boothId: randomUUID() };
test('valida propuestas con cuentas y materias, sin imponer nombres personales al título', () => {
  assert.equal(proposalBody(valid).name, 'Robot 2026');
  for (const input of [{ ...valid, memberIds: [] }, { ...valid, teacherIds: [valid.teacherIds[0], valid.teacherIds[0]] }, { ...valid, subjects: ['Matemática', 'matematica'] }, { ...valid, imageUrl: 'data:image/png,invalid' }, { ...valid, githubUrl: 'https://github.com/a/b' }, { ...valid, boothId: 'fake' }, { ...valid, status: 'approved' }])
    assert.throws(() => proposalBody(input), error => error.status === 400);
});
test('HTTPS, GitHub exacto y videos directos impiden enlaces y protocolos inválidos', () => {
  assert.equal(httpsLinkError('https://github.com/equipo/proyecto', false, 'github'), '');
  assert.equal(httpsLinkError('https://example.com/video.mp4?signature=x', false, 'video'), '');
  for (const link of ['javascript:alert(1)', 'http://example.com/a', 'https://user:password@example.com/a', 'https://example.com/a b']) assert.ok(httpsLinkError(link));
  assert.ok(httpsLinkError('https://github.com.evil.example/a/b', false, 'github'));
});
test('solicitar cambios y reabrir requieren motivo y versión', () => {
  assert.deepEqual(reviewBody({ version: 1, action: 'approve', note: '' }), { version: 1, action: 'approve', note: '' });
  assert.throws(() => reviewBody({ version: 1, action: 'changes', note: '' }));
  assert.throws(() => reviewBody({ version: 0, action: 'approve', note: '' }));
});
