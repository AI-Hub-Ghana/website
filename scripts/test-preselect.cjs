async function test() {
  const r = await fetch('http://127.0.0.1:4321/get-involved');
  const html = await r.text();
  console.log('Has register form:', html.includes('id="register-form"'));
  console.log('Has Mona Sans font:', html.includes('Mona+Sans'));
  console.log('Has lang en-GB:', html.includes('lang="en-GB"'));
  console.log('Has webp source:', html.includes('type="image/webp"'));
}

test().catch(console.error);
