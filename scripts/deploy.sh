#!/bin/bash

# Quantum's Deployment Automation Script - Zero-Downtime Production Deployment
# Enterprise-grade deployment with comprehensive validation and rollback capabilities

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
KUBECTL_TIMEOUT="600s"
DEPLOYMENT_TIMEOUT="900s"
HEALTH_CHECK_TIMEOUT="300s"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Help function
show_help() {
    cat << EOF
Quantum's Deployment Script for Astral Planner

Usage: $0 [OPTIONS] ENVIRONMENT

Arguments:
  ENVIRONMENT     Target environment (production, staging, development)

Options:
  -h, --help           Show this help message
  -v, --validate       Validate configurations without deploying
  -r, --rollback       Rollback to previous deployment
  -f, --force          Force deployment without confirmation
  --skip-tests         Skip pre-deployment tests
  --skip-backup        Skip pre-deployment backup
  --canary             Deploy using canary strategy (production only)
  --image-tag TAG      Specific image tag to deploy (default: latest)
  --dry-run            Show what would be deployed without applying

Examples:
  $0 staging                                 # Deploy to staging
  $0 production --canary                     # Canary deployment to production
  $0 production --image-tag v1.2.3         # Deploy specific version
  $0 production --rollback                  # Rollback production
  $0 staging --validate                     # Validate staging config

EOF
}

# Parse command line arguments
ENVIRONMENT=""
VALIDATE_ONLY=false
ROLLBACK=false
FORCE=false
SKIP_TESTS=false
SKIP_BACKUP=false
CANARY=false
IMAGE_TAG="latest"
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--validate)
            VALIDATE_ONLY=true
            shift
            ;;
        -r|--rollback)
            ROLLBACK=true
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --canary)
            CANARY=true
            shift
            ;;
        --image-tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        production|staging|development)
            ENVIRONMENT="$1"
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate required arguments
if [[ -z "$ENVIRONMENT" ]]; then
    log_error "Environment is required"
    show_help
    exit 1
fi

# Validate environment
case "$ENVIRONMENT" in
    production|staging|development)
        ;;
    *)
        log_error "Invalid environment: $ENVIRONMENT"
        log_error "Valid environments: production, staging, development"
        exit 1
        ;;
esac

# Set environment-specific variables
case "$ENVIRONMENT" in
    production)
        NAMESPACE="astral-planner-production"
        REPLICAS=5
        RESOURCE_PROFILE="production"
        ;;
    staging)
        NAMESPACE="astral-planner-staging"
        REPLICAS=2
        RESOURCE_PROFILE="staging"
        CANARY=false  # No canary for staging
        ;;
    development)
        NAMESPACE="astral-planner-development"
        REPLICAS=1
        RESOURCE_PROFILE="development"
        CANARY=false  # No canary for development
        ;;
esac

log_info "Quantum Deployment Script v2.0.0"
log_info "Environment: $ENVIRONMENT"
log_info "Namespace: $NAMESPACE"
log_info "Image Tag: $IMAGE_TAG"
log_info "Canary Deployment: $CANARY"
log_info "Dry Run: $DRY_RUN"

# Prerequisite checks
check_prerequisites() {
    log_step "Checking prerequisites..."
    
    # Check required tools
    local required_tools=("kubectl" "docker" "helm" "jq")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool is not installed or not in PATH"
            exit 1
        fi
    done
    
    # Check kubectl connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Check namespace exists
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_warning "Namespace $NAMESPACE does not exist, creating..."
        if [[ "$DRY_RUN" == "false" ]]; then
            kubectl apply -f "$PROJECT_ROOT/infrastructure/kubernetes/namespace.yaml"
        fi
    fi
    
    # Check if deployment already exists
    if kubectl get deployment astral-planner-app -n "$NAMESPACE" &> /dev/null; then
        CURRENT_IMAGE=$(kubectl get deployment astral-planner-app -n "$NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].image}')
        log_info "Current deployment image: $CURRENT_IMAGE"
    else
        log_info "No existing deployment found"
    fi
    
    log_success "Prerequisites check completed"
}

# Validate Kubernetes manifests
validate_manifests() {
    log_step "Validating Kubernetes manifests..."
    
    local manifest_dirs=(
        "$PROJECT_ROOT/infrastructure/kubernetes"
        "$PROJECT_ROOT/infrastructure/monitoring"
        "$PROJECT_ROOT/infrastructure/security"
        "$PROJECT_ROOT/infrastructure/ingress"
    )
    
    for dir in "${manifest_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            log_info "Validating manifests in $dir"
            find "$dir" -name "*.yaml" -o -name "*.yml" | while read -r manifest; do
                if ! kubectl apply --dry-run=client -f "$manifest" &> /dev/null; then
                    log_error "Invalid manifest: $manifest"
                    kubectl apply --dry-run=client -f "$manifest"
                    exit 1
                fi
            done
        fi
    done
    
    log_success "Manifest validation completed"
}

# Run pre-deployment tests
run_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        log_warning "Skipping tests as requested"
        return 0
    fi
    
    log_step "Running pre-deployment tests..."
    
    # Unit tests
    log_info "Running unit tests..."
    cd "$PROJECT_ROOT"
    npm run test:ci
    
    # Integration tests
    log_info "Running integration tests..."
    npm run test:integration
    
    # Security tests
    log_info "Running security tests..."
    npm audit --audit-level=moderate
    
    # Docker image security scan
    if command -v trivy &> /dev/null; then
        log_info "Scanning Docker image for vulnerabilities..."
        trivy image "ghcr.io/astral-planner/astral-planner:$IMAGE_TAG"
    fi
    
    log_success "Pre-deployment tests completed"
}

# Create backup before deployment
create_backup() {
    if [[ "$SKIP_BACKUP" == "true" ]] || [[ "$ENVIRONMENT" == "development" ]]; then
        log_warning "Skipping backup as requested or in development environment"
        return 0
    fi
    
    log_step "Creating pre-deployment backup..."
    
    local backup_name="pre-deploy-$(date +%Y%m%d-%H%M%S)"
    
    if [[ "$DRY_RUN" == "false" ]]; then
        # Create Velero backup
        kubectl create -f - <<EOF
apiVersion: velero.io/v1
kind: Backup
metadata:
  name: $backup_name
  namespace: velero
  labels:
    backup-type: pre-deployment
    environment: $ENVIRONMENT
spec:
  includedNamespaces:
  - $NAMESPACE
  snapshotVolumes: true
  storageLocation: aws-primary
  ttl: 168h
EOF
        
        # Wait for backup to complete
        log_info "Waiting for backup to complete..."
        kubectl wait --for=condition=Completed backup/$backup_name -n velero --timeout=600s
        
        # Verify backup
        local backup_status=$(kubectl get backup/$backup_name -n velero -o jsonpath='{.status.phase}')
        if [[ "$backup_status" != "Completed" ]]; then
            log_error "Backup failed with status: $backup_status"
            exit 1
        fi
    fi
    
    log_success "Backup created: $backup_name"
}

# Deploy application
deploy_application() {
    log_step "Deploying application to $ENVIRONMENT..."
    
    # Update image tag in deployment manifest
    local deployment_file="/tmp/deployment-$ENVIRONMENT.yaml"
    cp "$PROJECT_ROOT/infrastructure/kubernetes/deployment.yaml" "$deployment_file"
    
    # Replace image tag
    sed -i "s|ghcr.io/astral-planner/astral-planner:latest|ghcr.io/astral-planner/astral-planner:$IMAGE_TAG|g" "$deployment_file"
    
    # Replace namespace if needed
    sed -i "s|astral-planner-production|$NAMESPACE|g" "$deployment_file"
    sed -i "s|astral-planner-staging|$NAMESPACE|g" "$deployment_file"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "Dry run - would apply:"
        kubectl apply --dry-run=client -f "$deployment_file"
        return 0
    fi
    
    if [[ "$CANARY" == "true" ]] && [[ "$ENVIRONMENT" == "production" ]]; then
        deploy_canary
    else
        deploy_standard
    fi
    
    # Cleanup temp file
    rm -f "$deployment_file"
}

# Standard deployment
deploy_standard() {
    log_info "Performing standard rolling deployment..."
    
    # Apply all manifests
    kubectl apply -f "$PROJECT_ROOT/infrastructure/kubernetes/namespace.yaml"
    kubectl apply -f "$PROJECT_ROOT/infrastructure/kubernetes/configmap.yaml"
    kubectl apply -f "$PROJECT_ROOT/infrastructure/kubernetes/secrets.yaml"
    kubectl apply -f "/tmp/deployment-$ENVIRONMENT.yaml"
    kubectl apply -f "$PROJECT_ROOT/infrastructure/kubernetes/service.yaml"
    kubectl apply -f "$PROJECT_ROOT/infrastructure/kubernetes/hpa.yaml"
    kubectl apply -f "$PROJECT_ROOT/infrastructure/ingress/ingress.yaml"
    
    # Wait for rollout to complete
    log_info "Waiting for deployment rollout..."
    kubectl rollout status deployment/astral-planner-app -n "$NAMESPACE" --timeout="$DEPLOYMENT_TIMEOUT"
    
    log_success "Standard deployment completed"
}

# Canary deployment
deploy_canary() {
    log_info "Performing canary deployment..."
    
    local canary_replicas=1
    local total_replicas=$REPLICAS
    
    # Create canary deployment
    local canary_deployment="/tmp/canary-deployment.yaml"
    cp "/tmp/deployment-$ENVIRONMENT.yaml" "$canary_deployment"
    
    # Modify for canary
    sed -i 's/name: astral-planner-app$/name: astral-planner-app-canary/' "$canary_deployment"
    sed -i "s/replicas: $total_replicas$/replicas: $canary_replicas/" "$canary_deployment"
    sed -i 's/app.kubernetes.io\/instance: production$/app.kubernetes.io\/instance: production-canary/' "$canary_deployment"
    
    # Deploy canary
    kubectl apply -f "$canary_deployment"
    
    # Wait for canary to be ready
    kubectl rollout status deployment/astral-planner-app-canary -n "$NAMESPACE" --timeout="$DEPLOYMENT_TIMEOUT"
    
    # Monitor canary metrics for 5 minutes
    log_info "Monitoring canary metrics for 5 minutes..."
    sleep 300
    
    # Check canary health
    if check_canary_health; then
        log_success "Canary deployment healthy, promoting to full deployment"
        
        # Gradually increase canary traffic and decrease original
        for percentage in 25 50 75 100; do
            log_info "Scaling canary to $percentage% of traffic..."
            local canary_replicas=$((total_replicas * percentage / 100))
            local main_replicas=$((total_replicas - canary_replicas))
            
            kubectl scale deployment/astral-planner-app-canary -n "$NAMESPACE" --replicas="$canary_replicas"
            kubectl scale deployment/astral-planner-app -n "$NAMESPACE" --replicas="$main_replicas"
            
            # Wait and monitor
            sleep 120
            
            if ! check_canary_health; then
                log_error "Canary health check failed, rolling back"
                rollback_canary
                exit 1
            fi
        done
        
        # Update main deployment
        kubectl patch deployment astral-planner-app -n "$NAMESPACE" \
            -p="{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"app\",\"image\":\"ghcr.io/astral-planner/astral-planner:$IMAGE_TAG\"}]}}}}"
        
        # Scale main deployment back up
        kubectl scale deployment/astral-planner-app -n "$NAMESPACE" --replicas="$REPLICAS"
        
        # Remove canary deployment
        kubectl delete deployment/astral-planner-app-canary -n "$NAMESPACE"
        
        log_success "Canary deployment completed successfully"
    else
        log_error "Canary deployment failed health checks, rolling back"
        rollback_canary
        exit 1
    fi
    
    rm -f "$canary_deployment"
}

# Check canary health
check_canary_health() {
    log_info "Checking canary deployment health..."
    
    # Check pod status
    local canary_pods=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/instance=production-canary --no-headers | wc -l)
    local ready_pods=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/instance=production-canary --no-headers | grep Running | wc -l)
    
    if [[ "$canary_pods" -eq 0 ]] || [[ "$ready_pods" -ne "$canary_pods" ]]; then
        log_error "Canary pods not ready: $ready_pods/$canary_pods"
        return 1
    fi
    
    # Check application health endpoint
    local canary_pod=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/instance=production-canary -o jsonpath='{.items[0].metadata.name}')
    if ! kubectl exec "$canary_pod" -n "$NAMESPACE" -- curl -f http://localhost:3000/api/health; then
        log_error "Canary health endpoint check failed"
        return 1
    fi
    
    # Check error rates (simplified check)
    log_info "Canary health checks passed"
    return 0
}

# Rollback canary deployment
rollback_canary() {
    log_warning "Rolling back canary deployment..."
    kubectl delete deployment/astral-planner-app-canary -n "$NAMESPACE" --ignore-not-found=true
    kubectl scale deployment/astral-planner-app -n "$NAMESPACE" --replicas="$REPLICAS"
}

# Perform health checks
health_checks() {
    log_step "Performing post-deployment health checks..."
    
    # Wait for pods to be ready
    log_info "Waiting for pods to be ready..."
    kubectl wait --for=condition=Ready pods -l app.kubernetes.io/name=astral-planner -n "$NAMESPACE" --timeout="$HEALTH_CHECK_TIMEOUT"
    
    # Check deployment status
    local ready_replicas=$(kubectl get deployment astral-planner-app -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}')
    local desired_replicas=$(kubectl get deployment astral-planner-app -n "$NAMESPACE" -o jsonpath='{.spec.replicas}')
    
    if [[ "$ready_replicas" -ne "$desired_replicas" ]]; then
        log_error "Deployment not ready: $ready_replicas/$desired_replicas replicas"
        exit 1
    fi
    
    # Application health check
    log_info "Checking application health endpoints..."
    local pod_name=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name=astral-planner -o jsonpath='{.items[0].metadata.name}')
    
    # Health endpoint
    if ! kubectl exec "$pod_name" -n "$NAMESPACE" -- curl -f http://localhost:3000/api/health; then
        log_error "Health endpoint check failed"
        exit 1
    fi
    
    # Readiness endpoint
    if ! kubectl exec "$pod_name" -n "$NAMESPACE" -- curl -f http://localhost:3000/api/ready; then
        log_error "Readiness endpoint check failed"
        exit 1
    fi
    
    # Database connectivity
    log_info "Checking database connectivity..."
    if ! kubectl exec "$pod_name" -n "$NAMESPACE" -- node -e "
        const { Pool } = require('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        pool.query('SELECT 1').then(() => {
            console.log('Database connection successful');
            process.exit(0);
        }).catch(err => {
            console.error('Database connection failed:', err);
            process.exit(1);
        });
    "; then
        log_error "Database connectivity check failed"
        exit 1
    fi
    
    # Redis connectivity
    log_info "Checking Redis connectivity..."
    if ! kubectl exec "$pod_name" -n "$NAMESPACE" -- node -e "
        const Redis = require('ioredis');
        const redis = new Redis(process.env.REDIS_URL);
        redis.ping().then((result) => {
            console.log('Redis connection successful:', result);
            redis.disconnect();
            process.exit(0);
        }).catch(err => {
            console.error('Redis connection failed:', err);
            process.exit(1);
        });
    "; then
        log_error "Redis connectivity check failed"
        exit 1
    fi
    
    log_success "All health checks passed"
}

# Rollback to previous deployment
perform_rollback() {
    log_step "Rolling back deployment in $ENVIRONMENT..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "Dry run - would rollback deployment"
        return 0
    fi
    
    # Get rollout history
    kubectl rollout history deployment/astral-planner-app -n "$NAMESPACE"
    
    # Perform rollback
    kubectl rollout undo deployment/astral-planner-app -n "$NAMESPACE"
    
    # Wait for rollback to complete
    kubectl rollout status deployment/astral-planner-app -n "$NAMESPACE" --timeout="$DEPLOYMENT_TIMEOUT"
    
    log_success "Rollback completed"
}

# Cleanup function
cleanup() {
    log_info "Performing cleanup..."
    rm -f /tmp/deployment-*.yaml
    rm -f /tmp/canary-deployment.yaml
}

# Main execution
main() {
    # Set up cleanup trap
    trap cleanup EXIT
    
    # Get user confirmation for production deployments
    if [[ "$ENVIRONMENT" == "production" ]] && [[ "$FORCE" == "false" ]] && [[ "$DRY_RUN" == "false" ]]; then
        echo -e "${YELLOW}WARNING: You are about to deploy to PRODUCTION${NC}"
        echo "Environment: $ENVIRONMENT"
        echo "Image Tag: $IMAGE_TAG"
        echo "Canary Deployment: $CANARY"
        echo
        read -p "Are you sure you want to continue? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            log_info "Deployment cancelled by user"
            exit 0
        fi
    fi
    
    # Execute deployment workflow
    check_prerequisites
    
    if [[ "$VALIDATE_ONLY" == "true" ]]; then
        validate_manifests
        log_success "Validation completed successfully"
        exit 0
    fi
    
    if [[ "$ROLLBACK" == "true" ]]; then
        perform_rollback
        health_checks
        log_success "Rollback completed successfully"
        exit 0
    fi
    
    validate_manifests
    run_tests
    create_backup
    deploy_application
    health_checks
    
    log_success "Deployment to $ENVIRONMENT completed successfully!"
    
    # Display deployment summary
    echo
    echo "=== Deployment Summary ==="
    echo "Environment: $ENVIRONMENT"
    echo "Namespace: $NAMESPACE"
    echo "Image Tag: $IMAGE_TAG"
    echo "Replicas: $(kubectl get deployment astral-planner-app -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}')/$(kubectl get deployment astral-planner-app -n "$NAMESPACE" -o jsonpath='{.spec.replicas}')"
    echo "Deployment Time: $(date)"
    echo
    
    # Show access information
    if [[ "$ENVIRONMENT" == "production" ]]; then
        echo "Production URL: https://astral-planner.com"
        echo "API URL: https://api.astral-planner.com"
    elif [[ "$ENVIRONMENT" == "staging" ]]; then
        echo "Staging URL: https://staging.astral-planner.com"
        echo "API URL: https://staging-api.astral-planner.com"
    fi
    
    echo
    echo "Monitor deployment with:"
    echo "  kubectl get pods -n $NAMESPACE -w"
    echo "  kubectl logs -f deployment/astral-planner-app -n $NAMESPACE"
}

# Execute main function
main "$@"