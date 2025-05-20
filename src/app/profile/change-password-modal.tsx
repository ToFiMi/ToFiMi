"use client"
import {Form, Input, message, Modal} from "antd";

type ModalProps={
    setIsModalOpen: (modalOpen: boolean)=> void
    isModalOpen: boolean

}

export default function ChangePasswordModal({setIsModalOpen, isModalOpen}: ModalProps){
    const [form] = Form.useForm()
    const handleChangePassword = async () => {
        try {
            const {current_password, new_password} = await form.validateFields()

            const res = await fetch('/api/me', {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({current_password, new_password})
            })

            if (res.ok) {
                message.success('Heslo bolo zmenené')
                setIsModalOpen(false)
                form.resetFields()
            } else {
                const err = await res.text()
                message.error(`Chyba: ${err}`)
            }
        } catch (e) {
            console.error(e)
        }
    }
    return(<Modal
        title="Zmena hesla"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        okText="Zmeniť heslo"
    >
        <Form form={form} layout="vertical" onFinish={handleChangePassword}>
            <Form.Item
                name="current_password"
                label="Aktuálne heslo"
                rules={[{required: true, message: 'Zadajte aktuálne heslo'}]}
            >
                <Input.Password/>
            </Form.Item>

            <Form.Item
                name="new_password"
                label="Nové heslo"
                rules={[
                    {required: true, message: 'Zadajte nové heslo'},
                    {
                        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/,
                        message: 'Heslo musí obsahovať veľké písmeno, malé písmeno, číslo a špeciálny znak',
                    },
                    {min: 8, message: 'Heslo musí mať aspoň 8 znakov'},
                ]}
            >
                <Input.Password/>
            </Form.Item>

            <Form.Item
                name="check_password"
                label="Zopakujte nové heslo"
                dependencies={['new_password']}
                rules={[
                    {required: true, message: 'Zopakujte nové heslo'},
                    ({getFieldValue}) => ({
                        validator(_, value) {
                            if (!value || getFieldValue('new_password') === value) {
                                return Promise.resolve()
                            }
                            return Promise.reject(new Error('Heslá sa nezhodujú'))
                        },
                    }),
                ]}
            >
                <Input.Password/>
            </Form.Item>
        </Form>
    </Modal>)
}
