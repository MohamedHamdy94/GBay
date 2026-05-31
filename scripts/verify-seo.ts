/**
 * Verification script for SEO implementation.
 * Checks robots.txt, sitemap.xml, and basic SEO tags on the English homepage.
 */

const BASE_URL = process.env.WEB_URL || 'http://localhost:3000';

async function checkRobotsTxt() {
  console.log('Checking /robots.txt...');
  try {
    const response = await fetch(`${BASE_URL}/robots.txt`);
    const content = await response.text();
    
    if (response.status === 200 && content.includes('User-agent: *') && content.includes('Sitemap:')) {
      console.log('✅ /robots.txt is valid');
      return true;
    } else {
      console.error('❌ /robots.txt is invalid or missing required content');
      console.error('Status:', response.status);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Failed to fetch /robots.txt:', error.message);
    return false;
  }
}

async function checkSitemapXml() {
  console.log('Checking /sitemap.xml...');
  try {
    const response = await fetch(`${BASE_URL}/sitemap.xml`);
    const content = await response.text();
    
    if (response.status === 200 && content.includes('<urlset')) {
      console.log('✅ /sitemap.xml is valid');
      return true;
    } else {
      console.error('❌ /sitemap.xml is invalid');
      console.error('Status:', response.status);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Failed to fetch /sitemap.xml:', error.message);
    return false;
  }
}

async function checkEnPage() {
  console.log('Checking /en...');
  try {
    const response = await fetch(`${BASE_URL}/en`);
    const content = await response.text();
    
    const hasTitle = content.includes('<title>GBay');
    const hasHreflang = content.includes('hreflang="en"');
    
    if (response.status === 200 && hasTitle && hasHreflang) {
      console.log('✅ /en page has correct SEO metadata');
      return true;
    } else {
      if (response.status !== 200) console.error('❌ /en page returned status', response.status);
      if (!hasTitle) console.error('❌ /en page is missing <title>GBay');
      if (!hasHreflang) console.error('❌ /en page is missing hreflang="en"');
      return false;
    }
  } catch (error: any) {
    console.error('❌ Failed to fetch /en:', error.message);
    return false;
  }
}

async function main() {
  console.log('--- SEO Verification ---');
  console.log(`Target URL: ${BASE_URL}\n`);
  
  const robotsOk = await checkRobotsTxt();
  const sitemapOk = await checkSitemapXml();
  const enPageOk = await checkEnPage();
  
  if (robotsOk && sitemapOk && enPageOk) {
    console.log('\n--- ALL SEO TESTS PASSED! ---');
    process.exit(0);
  } else {
    console.log('\n--- SEO VERIFICATION FAILED ---');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unexpected error during verification:', err);
  process.exit(1);
});
