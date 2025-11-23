// Simple test script to verify server functionality
const testUserId = 'test-user';
const supabaseUserId = '12345678-1234-1234-1234-123456789012'; // Mock Supabase UUID
const baseUrl = 'http://localhost:4000';

async function testServer() {
  console.log('Testing server endpoints...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    console.log('   Health check:', healthRes.ok ? 'OK' : 'FAILED');
    
    // Test user linking
    console.log('\n2. Testing user linking...');
    const linkRes = await fetch(`${baseUrl}/api/user/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supabaseUserId: supabaseUserId,
        extensionUserId: testUserId
      })
    });
    
    if (linkRes.ok) {
      const linkResult = await linkRes.json();
      console.log('   User linking:', linkResult.linked ? 'OK' : 'FAILED');
    } else {
      console.log('   User linking: FAILED -', linkRes.status);
    }
    
    // Test sending activity data
    console.log('\n3. Testing activity data...');
    const activityData = {
      userId: testUserId,
      events: [
        { domain: 'github.com', durationSec: 120 },
        { domain: 'stackoverflow.com', durationSec: 60 },
        { domain: 'google.com', durationSec: 30 }
      ]
    };
    
    const activityRes = await fetch(`${baseUrl}/api/activity/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activityData)
    });
    
    if (activityRes.ok) {
      const result = await activityRes.json();
      console.log('   Activity batch sent:', result.inserted, 'entries');
    } else {
      console.log('   Activity batch failed:', activityRes.status);
    }
    
    // Test getting daily report with extension user ID
    console.log('\n4. Testing daily report (extension user ID)...');
    const reportRes = await fetch(`${baseUrl}/api/reports/daily?userId=${testUserId}`);
    if (reportRes.ok) {
      const report = await reportRes.json();
      console.log('   Daily report:', report.topSites?.length || 0, 'sites found');
      if (report.topSites?.length > 0) {
        console.log('   Top site:', report.topSites[0]._id, '-', Math.round(report.topSites[0].durationSec/60) + 'm');
      }
    } else {
      console.log('   Daily report failed:', reportRes.status);
    }
    
    // Test getting daily report with Supabase user ID (should work via mapping)
    console.log('\n5. Testing daily report (Supabase user ID via mapping)...');
    const mappingRes = await fetch(`${baseUrl}/api/user/extension-id?supabaseUserId=${supabaseUserId}`);
    if (mappingRes.ok) {
      const mappingData = await mappingRes.json();
      console.log('   Extension ID mapping:', mappingData.extensionUserId || 'not found');
      
      if (mappingData.extensionUserId) {
        const supabaseReportRes = await fetch(`${baseUrl}/api/reports/daily?userId=${mappingData.extensionUserId}`);
        if (supabaseReportRes.ok) {
          const supabaseReport = await supabaseReportRes.json();
          console.log('   Mapped report:', supabaseReport.topSites?.length || 0, 'sites found');
        }
      }
    }
    
    // Test debug endpoint
    console.log('\n6. Testing debug endpoint...');
    const debugRes = await fetch(`${baseUrl}/api/debug/entries?userId=${testUserId}`);
    if (debugRes.ok) {
      const debug = await debugRes.json();
      console.log('   Debug info: Total entries:', debug.totalEntries, '| Today:', debug.todayEntries);
    } else {
      console.log('   Debug endpoint failed:', debugRes.status);
    }
    
    console.log('\n✅ Server test completed!');
    console.log('\nNext steps:');
    console.log('1. Start the frontend: npm run dev');
    console.log('2. Load the extension in Chrome');
    console.log('3. Set extension User ID to:', testUserId);
    console.log('4. In the frontend Dashboard, link extension with User ID:', testUserId);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nMake sure the server is running with: npm run server');
  }
}

testServer();