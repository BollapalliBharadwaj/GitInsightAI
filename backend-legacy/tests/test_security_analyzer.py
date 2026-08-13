import pytest
from services.security_analyzer import SecurityAnalyzer
from models.security_models import SecurityIssue

@pytest.fixture
def analyzer():
    return SecurityAnalyzer(owner="test-owner", repo="test-repo", default_branch="main")

def test_detect_exposed_files(analyzer):
    # 1. Test missing .gitignore and exposed secrets/keys
    file_paths = [
        "src/main.py",
        ".env",
        "keys/private.pem",
        "keys/id_rsa"
    ]
    issues = analyzer.detect_exposed_files(file_paths)
    titles = [issue.title for issue in issues]
    
    assert "Missing .gitignore file" in titles
    assert "Exposed .env Configuration File" in titles
    assert any("Exposed Cryptographic Key" in t for t in titles)

def test_detect_hardcoded_secrets(analyzer):
    # Test valid and placeholder secrets
    content = (
        "# AWS Access Key\n"
        "aws_key = 'AKIAIOSFODNN7ABCDEFG'\n"
        "# OpenAI Key\n"
        "openai = 'sk-proj-123456789012345678901234567890'\n"
        "# Placeholder keys (should be ignored)\n"
        "dummy = '<PASSWORD>'\n"
        "test_val = 'your-key-here'\n"
    )
    issues = analyzer.detect_hardcoded_secrets("config.py", content)
    titles = [issue.title for issue in issues]
    
    assert any("AWS" in t for t in titles)
    assert any("OpenAI" in t for t in titles)
    # Check that placeholders were ignored
    assert not any("dummy" in issue.description for issue in issues)

def test_detect_insecure_execution(analyzer):
    # Test eval, exec, os.system, subprocess, shell=True
    content = (
        "eval('1+1')\n"
        "exec('import os')\n"
        "os.system('ping 8.8.8.8')\n"
        "subprocess.run('ls -la', shell=True)\n"
    )
    issues = analyzer.detect_insecure_execution("main.py", content)
    titles = [issue.title for issue in issues]
    
    assert "Insecure Execution: eval()" in titles
    assert "Insecure Execution: exec()" in titles
    assert "Insecure Execution: os.system()" in titles
    assert "Insecure Execution: shell=True" in titles

def test_detect_unsafe_serialization(analyzer):
    # Test pickle.loads and yaml.load
    content = (
        "pickle.loads(payload)\n"
        "yaml.load(stream)\n"
    )
    issues = analyzer.detect_unsafe_serialization("loader.py", content)
    titles = [issue.title for issue in issues]
    
    assert "Unsafe Deserialization: pickle.loads()" in titles
    assert "Unsafe Deserialization: yaml.load()" in titles
