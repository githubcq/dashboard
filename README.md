# dashboard
Web UI for KubeEdge

## Environment Prepare

nodejs, npm/yarn/pnpm is needed, pnpm is recommended

## Install packages

```bash with npm
npm install
```

or

```bash with yarn
yarn install
```

or

```bash with pnpm
pnpm install
```

### Start project

```bash with npm
npm run dev --apiserver=[[proxy address, eg. https://192.168.33.129:6443]]
```
or

```bash with yarn
yarn dev --apiserver=[[proxy address, eg. https://192.168.33.129:6443]]
```
or

```bash with pnpm
pnpm dev --apiserver=[[proxy address, eg. https://192.168.33.129:6443]]
```

### Login with token
```bash
kubectl create serviceaccount curl-user -n kube-system
kubectl create clusterrolebinding curl-user-binding --clusterrole=cluster-admin --serviceaccount=kube-system:curl-user -n kube-system
kubectl -n kube-system describe secret $(kubectl -n kube-system get secret | grep curl-user | awk '{print $1}'
```