# Skill: Kubernetes

Load when: mode deploy with cluster work, or keywords k8s/helm/manifest/pod/ingress/hpa/rollout. Assumes core/* loaded.

## Evidence
- Manifests/Helm charts + `docs/09-infrastructure.md`, `docs/14-deployment-guide.md`.
- Failing rollout: `kubectl describe` the pod/deploy, then logs of the one failing pod. Events over guessing.

## Common causes
Bad image tag/pull secret, resource limits/OOM, failing readiness/liveness probe, missing ConfigMap/Secret, ingress/service selector mismatch, migration job ordering.

## Do not
Read application code. Inspect the whole cluster — target the failing workload only. Confirm rollout/scaling with the user before executing.
