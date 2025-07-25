#!/bin/bash

echo "🚀 FLUX Migration - Step 5: Final Verification and Cleanup"
echo "=========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
total_issues=0
total_warnings=0

echo ""
echo "📋 Step 5a: Comprehensive File System Verification"
echo "=================================================="

echo ""
echo -e "${BLUE}🔍 Checking file renaming completion...${NC}"

# Check for any remaining old-named files
echo "   Looking for old file patterns:"

old_blueprint=$(find . -name "*.blueprint.yml" -type f ! -path "./node_modules/*" ! -path "./.git/*" | wc -l)
old_agent=$(find . -name "*.agent.yml" -type f ! -path "./node_modules/*" ! -path "./.git/*" | wc -l)
old_implementation=$(find . -name "*.implementation.json" -type f ! -path "./node_modules/*" ! -path "./.git/*" | wc -l)
old_report=$(find . -name "*.report.json" -type f ! -path "./node_modules/*" ! -path "./.git/*" | wc -l)
old_schema_blueprint=$(find . -name "blueprint.schema.json" -type f ! -path "./node_modules/*" ! -path "./.git/*" | wc -l)
old_schema_agent=$(find . -name "agent.schema.json" -type f ! -path "./node_modules/*" ! -path "./.git/*" | wc -l)
old_schema_impl=$(find . -name "implementation.schema.json" -type f ! -path "./node_modules/*" ! -path "./.git/*" | wc -l)

echo -e "   • *.blueprint.yml files: ${old_blueprint} (should be 0)"
echo -e "   • *.agent.yml files: ${old_agent} (should be 0)"
echo -e "   • *.implementation.json files: ${old_implementation} (should be 0)"
echo -e "   • *.report.json files: ${old_report} (should be 0)"
echo -e "   • blueprint.schema.json files: ${old_schema_blueprint} (should be 0)"
echo -e "   • agent.schema.json files: ${old_schema_agent} (should be 0)"
echo -e "   • implementation.schema.json files: ${old_schema_impl} (should be 0)"

if [ $((old_blueprint + old_agent + old_implementation + old_report + old_schema_blueprint + old_schema_agent + old_schema_impl)) -gt 0 ]; then
    echo -e "   ${RED}❌ Found unrenamed files${NC}"
    total_issues=$((total_issues + 1))
    
    echo "   Files that still need renaming:"
    find . -name "*.blueprint.yml" -o -name "*.agent.yml" -o -name "*.implementation.json" -o -name "*.report.json" -o -name "blueprint.schema.json" -o -name "agent.schema.json" -o -name "implementation.schema.json" | grep -v node_modules | grep -v .git
else
    echo -e "   ${GREEN}✅ All files renamed successfully${NC}"
fi

echo ""
echo -e "${BLUE}🔍 Verifying new file structure...${NC}"

new_requirements=$(find . -name "*.requirements.yml" -type f ! -path "./node_modules/*" ! -path "./.git/*" | wc -l)
new_instructions=$(find . -name "*.instructions.yml" -type f ! -path "./node_modules/*" ! -path "./.git/*" | wc -l)
new_specification=$(find . -name "*.specification.json" -type f ! -path "./node_modules/*" ! -path "./.git/*" | wc -l)
new_compliance=$(find . -name "*.compliance.json" -type f ! -path "./node_modules/*" ! -path "./.git/*" | wc -l)

echo -e "   • *.requirements.yml files: ${new_requirements}"
echo -e "   • *.instructions.yml files: ${new_instructions}"
echo -e "   • *.specification.json files: ${new_specification}"
echo -e "   • *.compliance.json files: ${new_compliance}"

if [ $new_requirements -gt 0 ] || [ $new_instructions -gt 0 ] || [ $new_specification -gt 0 ] || [ $new_compliance -gt 0 ]; then
    echo -e "   ${GREEN}✅ New file structure confirmed${NC}"
else
    echo -e "   ${YELLOW}⚠️  No new files found - check if migration completed${NC}"
    total_warnings=$((total_warnings + 1))
fi

echo ""
echo "📋 Step 5b: Content Verification"
echo "================================"

echo ""
echo -e "${BLUE}🔍 Checking for remaining ATOM references...${NC}"

# Check for ATOM references in files
atom_in_code=$(find . -type f \( -name "*.md" -o -name "*.json" -o -name "*.yml" -o -name "*.yaml" -o -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" \) ! -path "./node_modules/*" ! -path "./.git/*" ! -name "*.backup*" -exec grep -l "ATOM Framework\|@voilajsx/atom\|npm run atom:" {} \; 2>/dev/null | wc -l)

echo -e "   • Files with ATOM references: ${atom_in_code}"

if [ $atom_in_code -gt 0 ]; then
    echo -e "   ${YELLOW}⚠️  Found files with ATOM references:${NC}"
    find . -type f \( -name "*.md" -o -name "*.json" -o -name "*.yml" -o -name "*.yaml" -o -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" \) ! -path "./node_modules/*" ! -path "./.git/*" ! -name "*.backup*" -exec grep -l "ATOM Framework\|@voilajsx/atom\|npm run atom:" {} \; 2>/dev/null | head -10
    total_warnings=$((total_warnings + 1))
else
    echo -e "   ${GREEN}✅ No ATOM references found${NC}"
fi

echo ""
echo -e "${BLUE}🔍 Checking for old file extension references...${NC}"

old_ext_refs=$(find . -type f \( -name "*.md" -o -name "*.json" -o -name "*.yml" -o -name "*.yaml" -o -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" \) ! -path "./node_modules/*" ! -path "./.git/*" ! -name "*.backup*" -exec grep -l "\.blueprint\.yml\|\.agent\.yml\|\.implementation\.json\|\.report\.json" {} \; 2>/dev/null | wc -l)

echo -e "   • Files with old extension references: ${old_ext_refs}"

if [ $old_ext_refs -gt 0 ]; then
    echo -e "   ${YELLOW}⚠️  Found files with old extension references:${NC}"
    find . -type f \( -name "*.md" -o -name "*.json" -o -name "*.yml" -o -name "*.yaml" -o -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" \) ! -path "./node_modules/*" ! -path "./.git/*" ! -name "*.backup*" -exec grep -l "\.blueprint\.yml\|\.agent\.yml\|\.implementation\.json\|\.report\.json" {} \; 2>/dev/null | head -10
    total_warnings=$((total_warnings + 1))
else
    echo -e "   ${GREEN}✅ No old extension references found${NC}"
fi

echo ""
echo "📋 Step 5c: Package.json Verification"
echo "====================================="

echo ""
echo -e "${BLUE}🔍 Verifying package.json configuration...${NC}"

if [ -f "package.json" ]; then
    pkg_name=$(npm pkg get name 2>/dev/null | sed 's/"//g')
    echo -e "   • Package name: ${pkg_name}"
    
    if [ "$pkg_name" = "@voilajsx/flux" ]; then
        echo -e "   ${GREEN}✅ Package name updated correctly${NC}"
    else
        echo -e "   ${RED}❌ Package name not updated correctly${NC}"
        total_issues=$((total_issues + 1))
    fi
    
    # Check flux scripts
    flux_scripts=$(npm pkg get scripts 2>/dev/null | grep -o '"flux:[^"]*"' | wc -l)
    atom_scripts=$(npm pkg get scripts 2>/dev/null | grep -o '"atom:[^"]*"' | wc -l)
    
    echo -e "   • flux:* scripts found: ${flux_scripts}"
    echo -e "   • atom:* scripts remaining: ${atom_scripts}"
    
    if [ $flux_scripts -gt 0 ] && [ $atom_scripts -eq 0 ]; then
        echo -e "   ${GREEN}✅ Scripts updated correctly${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Script migration may be incomplete${NC}"
        total_warnings=$((total_warnings + 1))
    fi
else
    echo -e "   ${RED}❌ package.json not found${NC}"
    total_issues=$((total_issues + 1))
fi

echo ""
echo "📋 Step 5d: Functional Testing"
echo "=============================="

echo ""
echo -e "${BLUE}🔍 Testing FLUX commands...${NC}"

# Test flux:validate
echo -e "   Testing: npm run flux:validate"
if npm run flux:validate >/dev/null 2>&1; then
    echo -e "   ${GREEN}✅ flux:validate works${NC}"
else
    echo -e "   ${YELLOW}⚠️  flux:validate has issues (may need dependencies)${NC}"
    total_warnings=$((total_warnings + 1))
fi

# Test flux:types (if TypeScript is configured)
echo -e "   Testing: npm run flux:types"
if npm run flux:types >/dev/null 2>&1; then
    echo -e "   ${GREEN}✅ flux:types works${NC}"
else
    echo -e "   ${YELLOW}⚠️  flux:types has issues (may need dependencies)${NC}"
    total_warnings=$((total_warnings + 1))
fi

echo ""
echo "📋 Step 5e: Cleanup and Organization"
echo "===================================="

echo ""
echo -e "${BLUE}🧹 Backup file management...${NC}"

backup_count=$(find . -name "*.backup*" -type f ! -path "./node_modules/*" ! -path "./.git/*" | wc -l)
echo -e "   • Backup files created: ${backup_count}"

if [ $backup_count -gt 0 ]; then
    echo -e "   ${BLUE}Backup files found:${NC}"
    find . -name "*.backup*" -type f ! -path "./node_modules/*" ! -path "./.git/*" | head -10
    
    echo ""
    echo "   Options for backup files:"
    echo "   1. Keep them for safety (recommended for now)"
    echo "   2. Remove them after confirming migration success"
    echo "   3. Archive them to a backup directory"
fi

echo ""
echo -e "${BLUE}🔍 Documentation verification...${NC}"

flux_docs_exist=false
if [ -f "FLUX_FOUNDATION_PRINCIPLES.md" ]; then
    echo -e "   ${GREEN}✅ FLUX_FOUNDATION_PRINCIPLES.md exists${NC}"
    flux_docs_exist=true
fi
if [ -f "FLUX_FEATURE_SPEC.md" ]; then
    echo -e "   ${GREEN}✅ FLUX_FEATURE_SPEC.md exists${NC}"
    flux_docs_exist=true
fi

if [ "$flux_docs_exist" = false ]; then
    echo -e "   ${YELLOW}⚠️  FLUX documentation files not found${NC}"
    total_warnings=$((total_warnings + 1))
fi

echo ""
echo "📋 Step 5f: Migration Summary Report"
echo "===================================="

echo ""
echo -e "${BLUE}📊 Migration Status Summary:${NC}"
echo "   =================================="

if [ $total_issues -eq 0 ] && [ $total_warnings -eq 0 ]; then
    echo -e "   ${GREEN}🎉 MIGRATION COMPLETED SUCCESSFULLY!${NC}"
    echo ""
    echo -e "   ${GREEN}✅ All files renamed correctly${NC}"
    echo -e "   ${GREEN}✅ All content updated${NC}"
    echo -e "   ${GREEN}✅ Package.json configured${NC}"
    echo -e "   ${GREEN}✅ Scripts working${NC}"
elif [ $total_issues -eq 0 ]; then
    echo -e "   ${YELLOW}⚠️  MIGRATION COMPLETED WITH WARNINGS${NC}"
    echo -e "   ${GREEN}✅ Core migration successful${NC}"
    echo -e "   ${YELLOW}⚠️  ${total_warnings} warnings to review${NC}"
else
    echo -e "   ${RED}❌ MIGRATION HAS ISSUES${NC}"
    echo -e "   ${RED}❌ ${total_issues} critical issues found${NC}"
    echo -e "   ${YELLOW}⚠️  ${total_warnings} warnings to review${NC}"
fi

echo ""
echo -e "${BLUE}🎯 Next Steps:${NC}"
echo "   ============="

if [ $total_issues -eq 0 ]; then
    echo "   1. Test all FLUX commands thoroughly"
    echo "   2. Run your application to ensure functionality" 
    echo "   3. Update any remaining dependencies (ESLint, etc.)"
    echo "   4. Commit the migration to Git"
    echo "   5. Update CI/CD pipelines to use flux:* commands"
    echo "   6. Clean up backup files after confirming success"
else
    echo "   1. Fix the critical issues listed above"
    echo "   2. Re-run verification steps"
    echo "   3. Review backup files for reference"
fi

echo ""
echo -e "${BLUE}🧪 Recommended Testing:${NC}"
echo "   ===================="
echo "   npm run flux:validate"
echo "   npm run flux:types"
echo "   npm run flux:check"
echo "   npm run flux:compliance"

echo ""
echo "✅ Step 5 Complete: Final Verification Done"
echo "=========================================="
echo ""
echo -e "${GREEN}🎊 ATOM to FLUX Migration Process Complete!${NC}"
echo ""
echo -e "${BLUE}FLUX Framework: Where independent development streams"
echo -e "converge into powerful applications. ✨${NC}"