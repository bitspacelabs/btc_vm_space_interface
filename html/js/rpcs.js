main_baseURL = 'https://api.btcspace.org'
main_utxoBaseRpc = 'https://mempool.space/api/address/'
main_baseMempool = 'https://mempool.space'


// test_baseURL = 'http://54.206.113.217:8080'
// test_baseURL = 'https://127.0.0.1/test'
test_baseURL = 'https://api.btcspace.org/test'

test_utxoBaseRpc = 'https://mempool-testnet.fractalbitcoin.io/api/address/'
test_baseMempool = 'https://mempool-testnet.fractalbitcoin.io'



function setNet() {
    let isTest = false 
    if(!localStorage.net) {
        const isLocalTest =  window.location.hostname !== '127.0.0.1'
        isTest = isLocalTest
    }else{
        if(localStorage.net === 'fb-test') {
            isTest = true
        }
        if(localStorage.net === 'btc') {
            isTest = false
        }
    }
    window.isTest = isTest
    window.baseURL = isTest ? test_baseURL : main_baseURL
    window.utxoBaseRpc = isTest ? test_utxoBaseRpc : main_utxoBaseRpc
    window.baseMempool = isTest ? test_baseMempool : main_baseMempool

    netid.value = isTest ? 'fb-test' : 'btc'
}
setNet()

// window.baseURL = 'http://192.168.110.157:3333'
const api2 = baseURL + `/api/vm_logs?spaceid=`
window.netChange = () => {
    console.log(netid.value)
    localStorage.net = netid.value
    location.reload()
}
window.BTC20SPACE = `function pub_mint(){
    if(mint_supply < supply){
        const to = Transaction.outputs[1].address
        const max_mint = 50000
        const balance = balances[to]
        if(typeof balance === 'undefined'){
            balance = lmint
        }else{
            balance = balance + lmint
        }
        if(balance <= max_mint) {
            balances[to] = balance
            mint_supply = mint_supply + lmint
            const hash = Transaction.txid + 'i' + 1
            let curr_utxo = {}
            if(typeof utxos[to] !== 'undefined'){
                curr_utxo = utxos[to]
            }
            curr_utxo[hash] = lmint
            utxos[to] = curr_utxo
        }
    }
}
function pub_reutxo(){
    const from = Transaction.inputs[0].address
    if(typeof balances[from] !== 'undefined'){
        if(BN.isGreaterThanOrEqualTo(balances[from], 0)){
            if(typeof utxos[from] === 'undefined'){
                const hash = Transaction.txid + 'i' + 1
                let curr_utxo = {}
                const total = balances[from]
                curr_utxo[hash] = total
                utxos[from] = curr_utxo
            }
        }
    }
}
// space_type default: 0; 0: user to user; 1: user to space 2: space to user 3: space to space
function pub_transfer(num, FUI, TUI){
    if(typeof num === 'number'){
        if(BN.decimal(num) === true){
            if(num > 0) {
                const from = Transaction.inputs[0].address
                let to = Transaction.outputs[TUI].address
                let avb = 0
                let inputs = Transaction.inputs
                
                if(space_type == 1){
                    to = TUI
                }

                let isFromUser = space_type == 0 || space_type == 1
                if(isFromUser){
                    let i = 0
                    let from_utxo = {}
                    while(i < inputs.length){
                        let id = inputs[i].prevTxId + 'i' + inputs[i].outputIndex
                        if(typeof utxos[from] !== 'undefined'){
                            from_utxo = utxos[from]
                            if(typeof utxos[from][id] !== 'undefined'){
                                avb = BN.plus(avb, utxos[from][id])
                                delete from_utxo[id]
                            }
                        }
                        i = i + 1
                    }
                    if(typeof balances[from] !== 'undefined'){
                        if(BN.isGreaterThanOrEqualTo(balances[from], num)){
                            if(BN.isGreaterThanOrEqualTo(avb, num)){
                                balances[from] = BN.minus(balances[from], num)
                                if(typeof balances[to] !== 'undefined'){
                                    balances[to] = BN.plus(balances[to], num)
                                }else{
                                    balances[to] = num
                                }
                                    
                                if(avb != num){
                                    // return self
                                    from_utxo[Transaction.txid + 'i' + FUI] = BN.minus(avb, num)
                                }
                                // update
                                utxos[from] = from_utxo

                                if(typeof space_type === 0){
                                    let curr_utxo = {}
                                    if(typeof utxos[to] !== 'undefined'){
                                        curr_utxo = utxos[to]
                                    }
                                    curr_utxo[Transaction.txid + 'i' + TUI] = num
                                    utxos[to] = curr_utxo
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}`
const getMempoolAddressUrl = (address) => {
    return baseMempool + '/address/' + address
}
const getMempoolTxUrl = (txid) => {
    return baseMempool + '/tx/' + txid
}

const shortAddress = (address) => {
    if(address && typeof address === 'string' && address.length > 15) {
        if(window?.outerWidth && window.outerWidth >= 1500) {
            return address
        }
        if(window?.outerWidth && window.outerWidth > 1500) {
            return address.substring(0, 16) + '...' + address.substring(address.length - 16, address.length)
        }
        return address.substring(0, 8) + '...' + address.substring(address.length - 8, address.length)
    }
}

window.shortAddress = shortAddress

const shortHash = (address) => {
    if(window?.outerWidth && window.outerWidth > 1500) {
        return address
    }
    if(address && typeof address === 'string' && address.length > 60) {
        return address.substring(0, 10) + '...' + address.substring(address.length - 10, address.length)
    }
}
window.shortHash = shortHash

const shortHash2 = (address) => {
    if(address && typeof address === 'string' && address.length > 60) {
        return address.substring(0, 10) + '...' + address.substring(address.length - 10, address.length)
    }
}
window.shortHash2 = shortHash2

let page = 1
window.next_logs = (spaceId) => {
    page ++
    rpc_logs(spaceId)
}
window.rpc_logs = (spaceId) => {
    axios.get(api2 + (spaceId || ''), {
        params: {
            page,
        }
    }).then(res => {
        console.log(res.data)
        const data = res.data.data
        if(data){
            for (const item of data) {
                const transaction = JSON.parse(item.t_json)
                // console.log(transaction)
                var node = document.createElement('li')
                var SpaceIDNode = document.createElement('div')
                var AddressBlockNode = document.createElement('div')
                var address1 = document.createElement('div')
                var address2 = document.createElement('div')
                for (const input of transaction.inputs) {
                    const blockLine = document.createElement('div')
                    blockLine.className = 'inputs'
                    const blockLineA = document.createElement('a')
                    blockLineA.innerText = shortAddress(input.address)
                    // blockLineA.setAttribute('')
                    blockLineA.href = getMempoolAddressUrl((input.address))
                    blockLineA.setAttribute('target', '_blank')
                    blockLine.appendChild(blockLineA)
                    address1.appendChild(blockLine)
                } 
                address1.className = 'inputs'
                for (const output of transaction.outputs) {
                    const blockLine = document.createElement('div')
                    blockLine.setAttribute('style', 'display: flex')
                    const blockLineA = document.createElement( shortAddress(output.address) ? 'a' : 'span')
                    const blockLineValue = document.createElement('space')
                    blockLineA.innerText = shortAddress(output.address) || (output.ASM ? 'RETURN OP' : '--')
                    blockLineValue.innerText = Number(output.value) / 1e8
                    // blockLineA.setAttribute('')
                    blockLineA.href = getMempoolAddressUrl((output.address))
                    blockLineA.setAttribute('target', '_blank')
                    blockLine.appendChild(blockLineA)
                    blockLine.appendChild(blockLineValue)
                    address2.appendChild(blockLine)
                } 
                address2.className = 'outputs'
                var ANode = document.createElement('a')
                AddressBlockNode.appendChild(address1)
                AddressBlockNode.appendChild(address2)
                AddressBlockNode.className = 'addresses'
                const AddressTitleNode = document.createElement('div')
                const AddressTitleLeftNode = document.createElement('div')
                const AddressTitleRightNode = document.createElement('div')
                const AddressTitleRightButtonNode = document.createElement('button')
                AddressTitleNode.setAttribute('style', 'display: flex; justify-content: space-between; margin-top: 10px; font-size: 24px')
                AddressTitleLeftNode.innerText = 'Inputs&outputs'
                AddressTitleRightButtonNode.innerText = 'More Info'
                AddressTitleRightNode.appendChild(AddressTitleRightButtonNode)
                AddressTitleNode.appendChild(AddressTitleLeftNode)
                AddressTitleNode.appendChild(AddressTitleRightNode)

                var LogNode = document.createElement('pre')
                LogNode.innerText = item?.update_log

                node.appendChild(SpaceIDNode)
                node.appendChild(ANode)
                node.appendChild(AddressTitleNode)
                node.appendChild(AddressBlockNode)
                node.appendChild(LogNode)

                SpaceIDNode.innerText = item.spaceid

                ANode.href = getMempoolTxUrl(transaction.txid)
                ANode.innerText = shortHash(transaction.txid)
                ANode.setAttribute('target', '_blank')

                logs_ul.appendChild(node)
            }
        }
    })
}

window.wallet = {
    async getAccounts() {
        try {
            return await window.unisat.getAccounts();
        } catch (error) {
            try {
                return await window.okxwallet.bitcoin.getAccounts();
            } catch (error) {
                
            }
        }
    },
    async requestAccounts() {
        try {
            return await window.unisat.requestAccounts();
        } catch (error) {
            try {
                return await window.okxwallet.bitcoin.requestAccounts();
            } catch (error) {
                
            }
        }
    },
    async signPsbt(arg){
        try {
            return await window.unisat.signPsbt(arg);
        } catch (error) {
            try {
                console.log(error)
                return await window.okxwallet.bitcoin.signPsbt(arg);
            } catch (error) {
                console.log(error)
            }
        }
    },
    async pushPsbt(arg){
        try {
            return await window.unisat.pushPsbt(arg);
        } catch (error) {
            console.log(error)
            try {
                return await window.okxwallet.bitcoin.pushPsbt(arg);
            } catch (error) {
                console.log(error)
            }
        }
    }
}
